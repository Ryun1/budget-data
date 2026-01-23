const std = @import("std");

pub fn sendErrorResponse(stream: std.net.Stream, code: u16, message: []const u8) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const body = try std.fmt.allocPrint(allocator, "{{\"error\":\"{s}\"}}", .{message});
    defer allocator.free(body);
    
    const status_text = switch (code) {
        400 => "Bad Request",
        404 => "Not Found",
        500 => "Internal Server Error",
        else => "Error",
    };
    
    const response = try std.fmt.allocPrint(
        allocator,
        "HTTP/1.1 {d} {s}\r\n" ++
        "Content-Type: application/json\r\n" ++
        "Access-Control-Allow-Origin: *\r\n" ++
        "Content-Length: {d}\r\n" ++
        "\r\n" ++
        "{s}",
        .{ code, status_text, body.len, body }
    );
    defer allocator.free(response);
    _ = try stream.write(response);
}
