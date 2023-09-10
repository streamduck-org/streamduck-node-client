# **DEPRECATED!** Originally was for [Rust version of Streamduck](https://github.com/streamduck-org/streamduck/tree/old-master)

[![discord](https://img.shields.io/badge/Discord-blue?style=for-the-badge)](https://discord.gg/zTvhS7eYuQ)
# Streamduck Node Client
![streamducklogo_cut](https://user-images.githubusercontent.com/12719947/151142599-07620c87-3b51-4a65-b956-4a5902f2f52c.png)

### Client library for interacting with [Streamduck](https://github.com/TheJebForge/streamduck) project
<br>

## Example usage
Following code creates instance of unix client and retrieves device list from Streamduck daemon
```js
const streamduck = require('streamduck-node-client');

let client = streamduck.newUnixClient();

await client.device_list()
```

## Documentation
Documentation of the library can be found here: [API Reference](https://node.streamduck.org/)
