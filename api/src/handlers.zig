const std = @import("std");
const db = @import("db.zig");
const c = @cImport({
    @cInclude("libpq-fe.h");
});

pub fn handleGetTreasury(stream: std.net.Stream, conn: *db.Connection) !void {
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
    var json = std.ArrayList(u8).init(conn.allocator);
    defer json.deinit();

    try json.appendSlice("{\"instance_id\":");
    try json.appendSlice(c.PQgetvalue(result, 0, 0));
    try json.appendSlice(",\"script_hash\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 1));
    try json.appendSlice("\",\"payment_address\":\"");
    try json.appendSlice(c.PQgetvalue(result, 0, 2));
    try json.appendSlice("\"}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetProjects(stream: std.net.Stream, conn: *db.Connection, path: []const u8) !void {
    // Check if it's a specific project request
    if (std.mem.indexOf(u8, path, "/api/projects/") != null) {
        // Extract project ID from path
        // For now, return all projects
    }

    const query = 
        \\SELECT project_id, identifier, label, description, vendor_label, 
        \\       created_at, updated_at
        \\FROM projects
        \\ORDER BY created_at DESC
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(conn.allocator);
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
            try json.appendSlice(label);
        }
        try json.appendSlice("\"}");
    }

    try json.appendSlice("]}");

    sendJsonResponse(stream, json.items) catch return;
}

pub fn handleGetTransactions(stream: std.net.Stream, conn: *db.Connection, path: []const u8) !void {
    const query = 
        \\SELECT tx_id, tx_hash, slot, block_height, event_type, 
        \\       project_id, tx_author, created_at
        \\FROM treasury_transactions
        \\ORDER BY slot DESC
        \\LIMIT 100
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(conn.allocator);
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
    const query = 
        \\SELECT milestone_id, project_id, identifier, label, status, 
        \\       amount_lovelace, maturity_slot
        \\FROM milestones
        \\ORDER BY project_id, identifier
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(conn.allocator);
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
    const query = 
        \\SELECT contract_id, project_id, payment_address, script_hash, created_at
        \\FROM vendor_contracts
        \\ORDER BY created_at DESC
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(conn.allocator);
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

pub fn handleGetEvents(stream: std.net.Stream, conn: *db.Connection) !void {
    const query = 
        \\SELECT event_id, tx_id, event_type, project_id, created_at
        \\FROM treasury_events
        \\ORDER BY created_at DESC
        \\LIMIT 100
    ;

    const result = try conn.query(query);
    defer c.PQclear(result);

    var json = std.ArrayList(u8).init(conn.allocator);
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
    const response = try std.fmt.allocPrint(
        stream.allocator,
        "HTTP/1.1 200 OK\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ json.len, json }
    );
    defer stream.allocator.free(response);
    _ = try stream.write(response);
}
