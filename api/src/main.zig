const std = @import("std");
const db = @import("db.zig");
const handlers = @import("handlers.zig");

const PORT = 8080;

pub fn main() !void {
    const port_env = std.os.getenv("PORT");
    const port: u16 = if (port_env) |p| 
        try std.fmt.parseInt(u16, p, 10)
    else 
        PORT;

    std.log.info("Starting Treasury API server on port {}", .{port});

    // Start HTTP server
    const address = try std.net.Address.parseIp4("0.0.0.0", port);
    var listener = try address.listen(.{
        .reuse_address = true,
    });
    defer listener.deinit();

    std.log.info("Server listening on http://0.0.0.0:{}", .{port});

    while (true) {
        var connection = try listener.accept();
        var thread = try std.Thread.spawn(.{}, handleRequest, .{connection});
        thread.detach();
    }
}

fn handleRequest(connection: std.net.Server.Connection) void {
    defer connection.stream.close();

    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Create database connection for this request
    const conn = db.init(allocator) catch |err| {
        std.log.err("Error connecting to database: {}", .{err});
        sendError(connection.stream, 500, "Database connection failed") catch {};
        return;
    };
    defer conn.deinit();

    var buffer: [8192]u8 = undefined;
    const bytes_read = connection.stream.read(buffer[0..]) catch |err| {
        std.log.err("Error reading request: {}", .{err});
        return;
    };

    if (bytes_read == 0) return;

    const request_line = std.mem.sliceTo(buffer[0..bytes_read], '\r');
    var parts = std.mem.splitSequence(u8, request_line, " ");

    const method = parts.first();
    const path_with_query = parts.next() orelse "";
    var path_iter_query = std.mem.splitSequence(u8, path_with_query, " ");
    const full_path = path_iter_query.first();
    var query_iter = std.mem.splitSequence(u8, full_path, "?");
    const path = query_iter.first();
    const query_string = query_iter.next() orelse "";

    std.log.info("{} {}", .{ method, path });

    // Route handling
    if (std.mem.eql(u8, method, "GET")) {
        if (std.mem.eql(u8, path, "/api/treasury")) {
            handlers.handleGetTreasury(connection.stream, &conn) catch |err| {
                std.log.err("Error handling treasury request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.eql(u8, path, "/api/projects")) {
            handlers.handleGetProjects(connection.stream, &conn, null) catch |err| {
                std.log.err("Error handling projects request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.indexOf(u8, path, "/api/projects/") != null) {
            // Extract project ID
            const id_str = path["/api/projects/".len..];
            const project_id = std.fmt.parseInt(i64, id_str, 10) catch |err| {
                std.log.err("Invalid project ID: {}", .{err});
                sendError(connection.stream, 400, "Invalid project ID") catch {};
                return;
            };
            handlers.handleGetProjectDetail(connection.stream, &conn, project_id) catch |err| {
                std.log.err("Error handling project detail request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.eql(u8, path, "/api/transactions")) {
            handlers.handleGetTransactions(connection.stream, &conn, null, query_string) catch |err| {
                std.log.err("Error handling transactions request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.indexOf(u8, path, "/api/transactions/") != null) {
            const hash = path["/api/transactions/".len..];
            handlers.handleGetTransactionDetail(connection.stream, &conn, hash) catch |err| {
                std.log.err("Error handling transaction detail request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.eql(u8, path, "/api/milestones")) {
            handlers.handleGetMilestones(connection.stream, &conn) catch |err| {
                std.log.err("Error handling milestones request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.eql(u8, path, "/api/vendor-contracts")) {
            handlers.handleGetVendorContracts(connection.stream, &conn) catch |err| {
                std.log.err("Error handling vendor contracts request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.startsWith(u8, path, "/api/events")) {
            handlers.handleGetEvents(connection.stream, &conn, query_string) catch |err| {
                std.log.err("Error handling events request: {}", .{err});
                sendError(connection.stream, 500, "Internal server error") catch {};
            };
        } else if (std.mem.eql(u8, path, "/health")) {
            sendOk(connection.stream, "{\"status\":\"ok\"}") catch {};
        } else {
            sendNotFound(connection.stream) catch {};
        }
    } else {
        sendNotFound(connection.stream) catch {};
    }
}

fn sendOk(stream: std.net.Stream, body: []const u8) !void {
    const response = try std.fmt.allocPrint(
        stream.allocator,
        "HTTP/1.1 200 OK\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ body.len, body }
    );
    defer stream.allocator.free(response);
    _ = try stream.write(response);
}

fn sendNotFound(stream: std.net.Stream) !void {
    const response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
    _ = try stream.write(response);
}

fn sendError(stream: std.net.Stream, code: u16, message: []const u8) !void {
    const body = try std.fmt.allocPrint(stream.allocator, "{{\"error\":\"{s}\"}}", .{message});
    defer stream.allocator.free(body);
    
    const response = try std.fmt.allocPrint(
        stream.allocator,
        "HTTP/1.1 {d} {s}\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ code, if (code == 500) "Internal Server Error" else "Bad Request", body.len, body }
    );
    defer stream.allocator.free(response);
    _ = try stream.write(response);
}
