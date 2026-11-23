module.exports = {
  networks: {
    development: {
      // Use the IPv4 loopback explicitly: Ganache only listens on 127.0.0.1, and
      // some Node versions resolve "localhost" to ::1 first and fail to connect.
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
