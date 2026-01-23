const std = @import("std");
const db = @import("db.zig");
const handlers = @import("handlers.zig");

const PORT = 8080;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.log.info("Starting Treasury API server on port {}", .{PORT});

    // Initialize database connection
    const conn = try db.init(allocator);
    defer conn.deinit();

    // Start HTTP server
    const address = try std.net.Address.parseIp4("0.0.0.0", PORT);
    var listener = try address.listen(.{
        .reuse_address = true,
    });
    defer listener.deinit();

    std.log.info("Server listening on http://0.0.0.0:{}", .{PORT});

    while (true) {
        var connection = try listener.accept();
        var thread = try std.Thread.spawn(.{}, handleRequest, .{ connection, conn });
        thread.detach();
    }
}

fn handleRequest(stream: std.net.Server.Connection, conn: *db.Connection) void {
    defer stream.stream.close();

    var buffer: [8192]u8 = undefined;
    const bytes_read = stream.stream.read(buffer[0..]) catch |err| {
        std.log.err("Error reading request: {}", .{err});
        return;
    };

    if (bytes_read == 0) return;

    const request = std.mem.sliceTo(&buffer, '\n');
    const method_and_path = std.mem.splitSequence(u8, request, " ");

    const method = method_and_path.first();
    var path_iter = std.mem.splitSequence(u8, method_and_path.next() orelse "", " ");
    const path = path_iter.first();

    std.log.info("{} {}", .{ method, path });

    // Route handling
    if (std.mem.eql(u8, method, "GET")) {
        if (std.mem.eql(u8, path, "/api/treasury")) {
            handlers.handleGetTreasury(stream.stream, conn) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else if (std.mem.startsWith(u8, path, "/api/projects")) {
            handlers.handleGetProjects(stream.stream, conn, path) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else if (std.mem.startsWith(u8, path, "/api/transactions")) {
            handlers.handleGetTransactions(stream.stream, conn, path) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else if (std.mem.startsWith(u8, path, "/api/milestones")) {
            handlers.handleGetMilestones(stream.stream, conn) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else if (std.mem.startsWith(u8, path, "/api/vendor-contracts")) {
            handlers.handleGetVendorContracts(stream.stream, conn) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else if (std.mem.startsWith(u8, path, "/api/events")) {
            handlers.handleGetEvents(stream.stream, conn) catch |err| {
                std.log.err("Error handling request: {}", .{err});
            };
        } else {
            sendNotFound(stream.stream) catch {};
        }
    } else {
        sendNotFound(stream.stream) catch {};
    }
}

fn sendNotFound(stream: std.net.Stream) !void {
    const response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
    _ = try stream.write(response);
}
