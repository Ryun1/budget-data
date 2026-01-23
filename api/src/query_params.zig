const std = @import("std");

pub fn parseQueryParams(allocator: std.mem.Allocator, query_string: []const u8) !QueryParams {
    var params = QueryParams{};
    
    if (query_string.len == 0) {
        return params;
    }

    var iter = std.mem.splitSequence(u8, query_string, "&");
    while (iter.next()) |pair| {
        var kv_iter = std.mem.splitSequence(u8, pair, "=");
        const key = kv_iter.first();
        const value = kv_iter.next() orelse continue;

        if (std.mem.eql(u8, key, "limit")) {
            params.limit = std.fmt.parseInt(i32, value, 10) catch 100;
            if (params.limit > 1000) params.limit = 1000; // Max limit
            if (params.limit < 1) params.limit = 1; // Min limit
        } else if (std.mem.eql(u8, key, "offset")) {
            params.offset = std.fmt.parseInt(i32, value, 10) catch 0;
            if (params.offset < 0) params.offset = 0; // Min offset
        } else if (std.mem.eql(u8, key, "event_type")) {
            params.event_type = try allocator.dupe(u8, value);
        } else if (std.mem.eql(u8, key, "project_id")) {
            params.project_id = std.fmt.parseInt(i64, value, 10) catch null;
        }
    }

    return params;
}

pub const QueryParams = struct {
    limit: i32 = 100,
    offset: i32 = 0,
    event_type: ?[]const u8 = null,
    project_id: ?i64 = null,
};
