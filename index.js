/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const ws = require('ws');
const randomstring = require('randomstring');

class StreamduckClient {
    constructor(protocol) {
        this.protocol = protocol;
    }

    list_connected_devices() {
        return this.protocol.request(
            {
                PluginName: "Core",
                Name: "List Connected Devices"
            }
        )
    }

    list_discovered_devices() {
        return this.protocol.request(
            {
                PluginName: "Core",
                Name: "List Discovered Devices"
            }
        )
    }
}

function buildRequestProtocol(opts) {
    let protocol = {
        pool: {},
        event_listeners: []
    };

    protocol.request = (name, data, timeout) => {
        let request_id = randomstring.generate();

        data = data ?? {};

        data.Name = name;
        data.RequestID = request_id;

        return new Promise((resolve, reject) => {
            let interval = undefined;

            if (protocol.connected()) {
                opts.client.send(JSON.stringify(data));
            } else {
                interval = setInterval(() => {
                    if (protocol.connected()) {
                        opts.client.send(JSON.stringify(data));
                        clearInterval(interval);
                    }
                }, opts.retry_interval);
            }

            let timer = setTimeout(() => {
                if (interval) clearInterval(interval);
                reject("Request timed out");
            }, timeout || opts.timeout);

            protocol.pool[request_id] = (data) => {
                clearTimeout(timer);
                resolve(data);
            };
        });
    };

    protocol.add_event_listener = (func) => {
        protocol.event_listeners.push(func);
    };

    protocol.connected = () => {
        if (opts.client != null) {
            return opts.client.readyState === 1;
        } else {
            return false;
        }
    };

    protocol.close = () => {
        opts.client.close();
    };

    return protocol;
}

/**
 * Initializes a new WebSocket Streamduck client
 * @param {{ip: string?, port: number?, retry_interval: number?, timeout: number?, reconnect: boolean?}?} opts
 */
exports.newClient = (opts) => {
    let ip = opts && opts.ip !== undefined ? opts.ip : "127.0.0.1";
    let port = opts && opts.port !== undefined ? opts.port : 42131;
    let retry_interval = opts && opts.retry_interval !== undefined ? opts.retry_interval : 200;
    let timeout = opts && opts.timeout !== undefined ? opts.timeout : 5000;
    let reconnect = opts && opts.reconnect !== undefined ? opts.reconnect : true;

    let ws_link = `ws://${ip}:${port}`

    let protocol_opts = {
        client: null,
        timeout,
        retry_interval
    };

    let protocol = buildRequestProtocol(protocol_opts);
    let streamduck = new StreamduckClient(protocol);

    let rec = () => {
        protocol_opts.client = new ws.WebSocket(ws_link)
            .on('open', async () => {
                // let version = await streamduck.version();
                //
                // let client_version = "0.2";
                // if (version !== client_version)
                //     console.log(`Daemon version doesn't match this client's version. Daemon is using ${version}, client is using ${client_version}`);

                console.log("Connected to Streamduck");
            })
            .on('message', data => {
                data = data.toString();

                try {
                    let obj = JSON.parse(data);

                    let callback = protocol.pool[obj.RequestID];

                    if (callback) {
                        callback(obj.Data);
                    }

                    delete protocol.pool[obj.RequestID];
                } catch (e) {

                }
            })
            .on('error', _ => {
                if (protocol_opts.client) {
                    protocol_opts.client.terminate()
                }
                protocol_opts.client = null;
            })
            .on('close', _ => {
                if (protocol_opts.client) {
                    protocol_opts.client.terminate()
                }
                protocol_opts.client = null;
            });
    }

    rec();
    setInterval(() => {
        if (protocol_opts.client == null && reconnect) {
            rec();
        }
    }, 2000);

    return streamduck;
};
