const std = @import("std");
const c = @cImport({
    @cInclude("libpq-fe.h");
});

pub const Connection = struct {
    conn: *c.PGconn,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, conn_string: []const u8) !Connection {
        const conn_str = try allocator.dupeZ(u8, conn_string);
        defer allocator.free(conn_str);

        const conn = c.PQconnectdb(conn_str);
        if (c.PQstatus(conn) != c.CONNECTION_OK) {
            const err_msg = c.PQerrorMessage(conn);
            std.log.err("Connection to database failed: {s}", .{err_msg});
            c.PQfinish(conn);
            return error.ConnectionFailed;
        }

        return Connection{
            .conn = conn,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Connection) void {
        c.PQfinish(self.conn);
    }

    pub fn query(self: *Connection, query_str: []const u8) !*c.PGresult {
        const query_z = try self.allocator.dupeZ(u8, query_str);
        defer self.allocator.free(query_z);

        const result = c.PQexec(self.conn, query_z);
        if (c.PQresultStatus(result) != c.PGRES_TUPLES_OK and c.PQresultStatus(result) != c.PGRES_COMMAND_OK) {
            const err_msg = c.PQerrorMessage(self.conn);
            std.log.err("Query failed: {s}", .{err_msg});
            c.PQclear(result);
            return error.QueryFailed;
        }

        return result;
    }
};

pub fn init(allocator: std.mem.Allocator) !*Connection {
    const db_url = std.os.getenv("DATABASE_URL") orelse "postgresql://postgres:postgres@localhost:5432/treasury_data";
    return try Connection.init(allocator, db_url);
}
