const std = @import("std");
const db = @import("db.zig");
const utils = @import("utils.zig");
const query_params = @import("query_params.zig");
const c = @cImport({
    @cInclude("libpq-fe.h");
});

pub fn handleGetTreasury(stream: std.net.Stream, conn: *db.Connection) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const query = 
        \\SELECT instance_id, script_hash, payment_address, stake_address, 
        \\       label, description, expiration, permissions, created_at, updated_at
        \\FROM treasury_instance
        \\LIMIT 1
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    const num_rows = c.PQntuples(result);
    if (num_rows == 0) {
        sendJsonResponse(stream, "{}") catch return;
        return;
    }

    // Build JSON response
    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"instance_id\":");
    try json.appendSlice(c.PQgetvalue(result, 0, 0));
    try json.appendSlice(",\"script_hash\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 1));
    try json.appendSlice("\",\"payment_address\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 2));
    try json.appendSlice("\",\"stake_address\":\"");
    const stake_addr = c.PQgetvalue(result, 0, 3);
    if (stake_addr[0] != 0) {
        try json.appendSlice(std.mem.span(stake_addr));
    }
    try json.appendSlice("\",\"label\":\"");
    const label = c.PQgetvalue(result, 0, 4);
    if (label[0] != 0) {
        try utils.escapeJsonInPlace(allocator, std.mem.span(label), &json);
    }
    try json.appendSlice("\",\"description\":\"");
    const description = c.PQgetvalue(result, 0, 5);
    if (description[0] != 0) {
        try utils.escapeJsonInPlace(allocator, std.mem.span(description), &json);
    }
    try json.appendSlice("\"}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetProjects(stream: std.net.Stream, conn: *db.Connection, project_id: ?i64) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const query = 
        \\SELECT project_id, identifier, label, description, vendor_label, 
        \\       contract_url, created_at, updated_at
        \\FROM projects
        \\ORDER BY created_at DESC
        \\LIMIT 100
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"projects\":[");
    
    const num_rows = c.PQntuples(result);
    var i: c_int = 0;
    while (i < num_rows) : (i += 1) {
        if (i > 0) try json.appendSlice(",");
        try json.appendSlice("{\"project_id\":");
        try json.appendSlice(c.PQgetvalue(result, i, 0));
        try json.appendSlice(",\"identifier\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 1));
        try json.appendSlice("\",\"label\":\"");
        const label = c.PQgetvalue(result, i, 2);
        if (label[0] != 0) {
            try utils.escapeJsonInPlace(allocator, std.mem.span(label), &json);
        }
        try json.appendSlice("\",\"vendor_label\":\"");
        const vendor_label = c.PQgetvalue(result, i, 4);
        if (vendor_label[0] != 0) {
            try utils.escapeJsonInPlace(allocator, std.mem.span(vendor_label), &json);
        }
        try json.appendSlice("\"}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetProjectDetail(stream: std.net.Stream, conn: *db.Connection, project_id: i64) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const query = try std.fmt.allocPrint(
        allocator,
        \\SELECT project_id, identifier, label, description, vendor_label, 
        \\       vendor_details, contract_url, contract_hash, created_at, updated_at
        \\FROM projects
        \\WHERE project_id = {d}
    ,
        .{project_id}
    );
    defer allocator.free(query);

    const result = try conn.query(query);
    defer c.PQclear(result);

    const num_rows = c.PQntuples(result);
    if (num_rows == 0) {
        sendError(stream, 404, "Project not found") catch return;
        return;
    }

    var json = std.ArrayList(u8).init(conn.allocator);
    defer json.deinit();

    try json.appendSlice("{\"project_id\":");
    try json.appendSlice(c.PQgetvalue(result, 0, 0));
    try json.appendSlice(",\"identifier\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 1));
    try json.appendSlice("\",\"label\":\"");
    const label = c.PQgetvalue(result, 0, 2);
    if (label[0] != 0) {
        try utils.escapeJsonInPlace(conn.allocator, std.mem.span(label), &json);
    }
    try json.appendSlice("\",\"description\":\"");
    const description = c.PQgetvalue(result, 0, 3);
    if (description[0] != 0) {
        try utils.escapeJsonInPlace(allocator, std.mem.span(description), &json);
    }
    try json.appendSlice("\",\"vendor_label\":\"");
    const vendor_label = c.PQgetvalue(result, 0, 4);
    if (vendor_label[0] != 0) {
        try utils.escapeJsonInPlace(allocator, std.mem.span(vendor_label), &json);
    }
    try json.appendSlice("\"}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetTransactionDetail(stream: std.net.Stream, conn: *db.Connection, tx_hash: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Escape single quotes to prevent SQL injection
    var escaped_hash = std.ArrayList(u8).init(allocator);
    defer escaped_hash.deinit();
    for (tx_hash) |char| {
        if (char == '\'') {
            try escaped_hash.appendSlice("''");
        } else {
            try escaped_hash.append(char);
        }
    }

    const query = try std.fmt.allocPrint(
        allocator,
        \\SELECT tx_id, tx_hash, slot, block_height, event_type, 
        \\       project_id, tx_author, metadata, created_at
        \\FROM treasury_transactions
        \\WHERE tx_hash = '{s}'
    ,
        .{escaped_hash.items}
    );
    defer allocator.free(query);

    const result = try conn.query(query);
    defer c.PQclear(result);

    const num_rows = c.PQntuples(result);
    if (num_rows == 0) {
        sendError(stream, 404, "Transaction not found") catch return;
        return;
    }

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"tx_hash\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 1));
    try json.appendSlice("\",\"event_type\":\"");
    const event_type = c.PQgetvalue(result, 0, 4);
    if (event_type[0] != 0) {
        try json.appendSlice(std.mem.span(event_type));
    }
    try json.appendSlice("\",\"slot\":");
    try json.appendSlice(c.PQgetvalue(result, 0, 2));
    try json.appendSlice("}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetTransactions(stream: std.net.Stream, conn: *db.Connection, tx_hash: ?[]const u8, query_string: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Parse query parameters for pagination and filtering
    const params = try query_params.parseQueryParams(allocator, query_string);
    defer if (params.event_type) |et| allocator.free(et);

    var query_builder = std.ArrayList(u8).init(allocator);
    defer query_builder.deinit();

    try query_builder.appendSlice(
        \\SELECT tx_id, tx_hash, slot, block_height, event_type, 
        \\       project_id, tx_author, created_at
        \\FROM treasury_transactions
    );

    // Add WHERE clause if filters are present
    var has_where = false;
    if (params.event_type) |event_type| {
        try query_builder.appendSlice(" WHERE event_type = '");
        try query_builder.appendSlice(event_type);
        try query_builder.appendSlice("'");
        has_where = true;
    }
    if (params.project_id) |project_id| {
        if (has_where) {
            try query_builder.appendSlice(" AND");
        } else {
            try query_builder.appendSlice(" WHERE");
            has_where = true;
        }
        try query_builder.writer().print(" project_id = {d}", .{project_id});
    }

    try query_builder.writer().print(
        \\ ORDER BY slot DESC
        \\ LIMIT {d} OFFSET {d}
    , .{ params.limit, params.offset });

    const query = try query_builder.toOwnedSlice();
    defer allocator.free(query);

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"transactions\":[");
    
    const num_rows = c.PQntuples(result);
    var i: c_int = 0;
    while (i < num_rows) : (i += 1) {
        if (i > 0) try json.appendSlice(",");
        try json.appendSlice("{\"tx_hash\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 1));
        try json.appendSlice("\",\"event_type\":\"");
        const event_type = c.PQgetvalue(result, i, 4);
        if (event_type[0] != 0) {
            try json.appendSlice(event_type);
        }
        try json.appendSlice("\",\"slot\":");
        try json.appendSlice(c.PQgetvalue(result, i, 2));
        try json.appendSlice("}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetMilestones(stream: std.net.Stream, conn: *db.Connection) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const query = 
        \\SELECT milestone_id, project_id, identifier, label, status, 
        \\       amount_lovelace, maturity_slot
        \\FROM milestones
        \\ORDER BY project_id, identifier
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"milestones\":[");
    
    const num_rows = c.PQntuples(result);
    var i: c_int = 0;
    while (i < num_rows) : (i += 1) {
        if (i > 0) try json.appendSlice(",");
        try json.appendSlice("{\"milestone_id\":");
        try json.appendSlice(c.PQgetvalue(result, i, 0));
        try json.appendSlice(",\"project_id\":");
        try json.appendSlice(c.PQgetvalue(result, i, 1));
        try json.appendSlice(",\"identifier\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 2));
        try json.appendSlice("\",\"status\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 4));
        try json.appendSlice("\"}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetVendorContracts(stream: std.net.Stream, conn: *db.Connection) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const query = 
        \\SELECT contract_id, project_id, payment_address, script_hash, created_at
        \\FROM vendor_contracts
        \\ORDER BY created_at DESC
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"vendor_contracts\":[");
    
    const num_rows = c.PQntuples(result);
    var i: c_int = 0;
    while (i < num_rows) : (i += 1) {
        if (i > 0) try json.appendSlice(",");
        try json.appendSlice("{\"contract_id\":");
        try json.appendSlice(c.PQgetvalue(result, i, 0));
        try json.appendSlice(",\"payment_address\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 2));
        try json.appendSlice("\"}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetEvents(stream: std.net.Stream, conn: *db.Connection, query_string: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Parse query parameters for pagination and filtering
    const params = try query_params.parseQueryParams(allocator, query_string);
    defer if (params.event_type) |et| allocator.free(et);

    var query_builder = std.ArrayList(u8).init(allocator);
    defer query_builder.deinit();

    try query_builder.appendSlice(
        \\SELECT event_id, tx_id, event_type, project_id, created_at
        \\FROM treasury_events
    );

    // Add WHERE clause if filters are present
    var has_where = false;
    if (params.event_type) |event_type| {
        try query_builder.appendSlice(" WHERE event_type = '");
        try query_builder.appendSlice(event_type);
        try query_builder.appendSlice("'");
        has_where = true;
    }
    if (params.project_id) |project_id| {
        if (has_where) {
            try query_builder.appendSlice(" AND");
        } else {
            try query_builder.appendSlice(" WHERE");
            has_where = true;
        }
        try query_builder.writer().print(" project_id = {d}", .{project_id});
    }

    try query_builder.writer().print(
        \\ ORDER BY created_at DESC
        \\ LIMIT {d} OFFSET {d}
    , .{ params.limit, params.offset });

    const query = try query_builder.toOwnedSlice();
    defer allocator.free(query);

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(allocator);
    defer json.deinit();

    try json.appendSlice("{\"events\":[");
    
    const num_rows = c.PQntuples(result);
    var i: c_int = 0;
    while (i < num_rows) : (i += 1) {
        if (i > 0) try json.appendSlice(",");
        try json.appendSlice("{\"event_id\":");
        try json.appendSlice(c.PQgetvalue(result, i, 0));
        try json.appendSlice(",\"event_type\":\"");
        try json.appendSlice(c.PQgetvalue(result, i, 2));
        try json.appendSlice("\"}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

fn sendJsonResponse(stream: std.net.Stream, json: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const response = try std.fmt.allocPrint(
        allocator,
        "HTTP/1.1 200 OK\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ json.len, json }
    );
    defer allocator.free(response);
    _ = try stream.write(response);
}

fn sendError(stream: std.net.Stream, code: u16, message: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const body = try std.fmt.allocPrint(allocator, "{{\"error\":\"{s}\"}}", .{message});
    defer allocator.free(body);
    
    const response = try std.fmt.allocPrint(
        allocator,
        "HTTP/1.1 {d} {s}\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ code, if (code == 500) "Internal Server Error" else "Not Found", body.len, body }
    );
    defer allocator.free(response);
    _ = try stream.write(response);
}
