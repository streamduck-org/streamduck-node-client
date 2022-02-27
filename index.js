const net = require('net'),
	randomstring = require('randomstring');

/**
 * Client class that contains methods for communicating with Streamduck daemon
 */
class StreamduckClient {
	constructor(protocol) {
		this.protocol = protocol;
	}

	/**
	 * Checks if protocol is currently connected to daemon
	 * @returns {boolean} Connection status
	 */
	is_connected() {
		return this.protocol.connected()
	}

	/**
	 * Retrieves version of socket API that daemon is using
	 * @returns {Promise<string>} Version of the daemon
	 */
	version() {
		return this.protocol.request(
			{
				ty: "socket_version"
			}
		).then(data => data.version);
	}

	/**
	 * Retrieves device list currently recognized by daemon
	 * @returns {Promise<Array.<{device_type: string, serial_number: string, managed: boolean, online: boolean}>>} Device list
	 */
	device_list() {
		return this.protocol.request(
			{
				ty: "list_devices"
			}
		).then(data => data.devices)
	}

	/**
	 * Retrieves data of specific device
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<?{device_type: string, serial_number: string, managed: boolean, online: boolean}>} Device Data, null if device wasn't found
	 */
	get_device(serial_number) {
		return this.protocol.request(
			{
				ty: "get_device",
				data: {
					serial_number
				}
			}
		).then(data => {
			if (data.Found) {
				return data.Found;
			} else {
				return null;
			}
		})
	}

	/**
	 * Adds device into managed list
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"NotFound"|"AlreadyRegistered"|"Added">} Result of the operation 
	 */
	add_device(serial_number) {
		return this.protocol.request(
			{
				ty: "add_device",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Removes device from managed list
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"NotRegistered"|"Removed">} Result of the operation 
	 */
	remove_device(serial_number) {
		return this.protocol.request(
			{
				ty: "remove_device",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Reloads all device configs, all unsaved changes will be lost doing this
	 * @returns {Promise<"ConfigError"|"Reloaded">} Result of the operation 
	 */
	reload_device_configs() {
		return this.protocol.request(
			{
				ty: "reload_device_configs",
			}
		)
	}

	/**
	 * Reloads device config of specified device, all unsaved changes will be lost doing this
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"ConfigError"|"DeviceNotFound"|"Reloaded">} Result of the operation 
	 */
	reload_device_config(serial_number) {
		return this.protocol.request(
			{
				ty: "reload_device_config",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Saves all device configs
	 * @returns {Promise<"ConfigError"|"Saved">} Result of the operation
	 */
	save_device_configs() {
		return this.protocol.request(
			{
				ty: "save_device_configs",
			}
		)
	}

	/**
	 * Saves device config of specified device
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"ConfigError"|"DeviceNotFound"|"Saved">} Return of the operation
	 */
	save_device_config(serial_number) {
		return this.protocol.request(
			{
				ty: "save_device_config",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Gets device config of specified device
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<?{vid: number, pid: number, serial: string, brightness: number, layout: Object}>} Device config, null if device wasn't found
	 */
	get_device_config(serial_number) {
		return this.protocol.request(
			{
				ty: "get_device_config",
				data: {
					serial_number
				}
			}
		).then(data => {
			if (data.Config) {
				return data.Config;
			} else {
				return null;
			}
		})
	}

	/**
	 * Exports device config from daemon
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<?string>} String that represents device config, null if device wasn't found
	 */
	export_device_config(serial_number) {
		return this.protocol.request(
			{
				ty: "export_device_config",
				data: {
					serial_number
				}
			}
		).then(data => {
			if (data.Exported) {
				return data.Exported;
			} else {
				return null;
			}
		})
	}


	/**
	 * Imports device config from string into daemon
	 * @param {string} serial_number Serial number of the device
	 * @param {string} config String that represents device config
	 * @returns {Promise<"DeviceNotFound"|"InvalidConfig"|"FailedToSave"|"Imported">} Result of the operation. "FailedToSave" if error happened while saving config on daemon's end
	 */
	import_device_config(serial_number, config) {
		return this.protocol.request(
			{
				ty: "import_device_config",
				data: {
					serial_number,
					config
				}
			}
		)
	}

	/**
	 * Sets brightness of specified device
	 * @param {string} serial_number Serial number of the device
	 * @param {number} brightness Brightness value (integer 0-100 or higher)
	 * @returns {Promise<"DeviceNotFound"|"Set">} Result of the operation 
	 */
	set_brightness(serial_number, brightness) {
		return this.protocol.request(
			{
				ty: "set_brightness",
				data: {
					serial_number,
					brightness
				}
			}
		)
	}

	/**
	 * Lists modules daemon has loaded
	 * @returns {Promise<Array.<{name: string, author: string, description: string, version: string, used_features: Array.<Array.<string>>}>>} Module list 
	 */
	list_modules() {
		return this.protocol.request(
			{
				ty: "list_modules"
			}
		).then(data => data.modules)
	}

	/**
	 * Lists components provided by loaded modules
	 * @returns {Promise<Object.<string, Object.<string, {default_looks: Object, description: string, display_name: string}>>>} Map of modules to maps of component names to component definitions
	 */
	list_components() {
		return this.protocol.request(
			{
				ty: "list_components"
			}
		).then(data => data.components)
	}

	/**
	 * Retrieves module values of specified module
	 * @param {string} module_name Module name
	 * @returns {Promise<?Array.<{name: string, display_name: string, ty: Object, value: Object}>>} Module values, null if module wasn't found
	 */
	get_module_values(module_name) {
		this.protocol.request(
			{
				ty: "get_module_values",
				data: {
					module_name
				}
			}
		).then(data => {
			if (data.Values) {
				return data.Values;
			} else {
				return null;
			}
		})
	}

	/**
	 * Sets module values for specified module
	 * @param {string} module_name Module name
	 * @param {Array.<{name: string, display_name: string, ty: Object, value: Object}>} value Array of values
	 * @returns {Promise<"ModuleNotFound"|"Set">} Result of the operation
	 */
	set_module_value(module_name, value) {
		return this.protocol.request(
			{
				ty: "set_module_values",
				data: {
					module_name,
					value
				}
			}
		)
	}

	/**
	 * Gets screen stack of specified device
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<Array.<Object.<string, Object>>>} Screen stack array, null if device wasn't found
	 */
	get_stack(serial_number) {
		return this.protocol.request(
			{
				ty: "get_stack",
				data: {
					serial_number
				}
			}
		).then(data => {
			if (data.Stack) {
				return data.Stack;
			} else {
				return null;
			}
		})
	}

	/**
	 * Gets current screen of specified device
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<Object.<string, Object>>} Screen consisting of key indices and button objects, null if device wasn't found
	 */
	get_current_screen(serial_number) {
		return this.protocol.request(
			{
				ty: "get_current_screen",
				data: {
					serial_number
				}
			}
		).then(data => {
			if (data.Screen) {
				return data.Screen;
			} else {
				return null;
			}
		})
	}

	/**
	 * Retrieves button from current screen of specified device
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @returns {Promise<Object>} Button object, null if device or button wasn't found
	 */
	get_button(serial_number, key) {
		return this.protocol.request(
			{
				ty: "get_button",
				data: {
					serial_number,
					key
				}
			}
		).then(data => {
			if (data.Button) {
				return data.Button;
			} else {
				return null;
			}
		})
	}

	/**
	 * Sets button on current screen for specified device, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {Object} button Button object
	 * @returns {Promise<"NoScreen"|"DeviceNotFound"|"Set">} Result of the operation
	 */
	set_button(serial_number, key, button) {
		return this.protocol.request(
			{
				ty: "set_button",
				data: {
					serial_number,
					key,
					button
				}
			}
		)
	}

	/**
	 * Clears button from current screen for specified device, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @returns {Promise<"DeviceNotFound"|"FailedToClear"|"Cleared">} Result of the operation
	 */
	clear_button(serial_number, key) {
		return this.protocol.request(
			{
				ty: "clear_button",
				data: {
					serial_number,
					key
				}
			}
		)
	}

	/**
	 * Creates a new empty button, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @returns {Promise<"DeviceNotFound"|"FailedToCreate"|"Created">} Result of the operation
	 */
	new_button(serial_number, key) {
		return this.protocol.request(
			{
				ty: "new_button",
				data: {
					serial_number,
					key
				}
			}
		)
	}

	/**
	 * Creates a new button from component, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {string} component_name Component name
	 * @returns {Promise<"DeviceNotFound"|"ComponentNotFound"|"FailedToCreate"|"Created">} Result of the operation
	 */
	new_button_from_component(serial_number, key, component_name) {
		return this.protocol.request(
			{
				ty: "new_button_from_component",
				data: {
					serial_number,
					key,
					component_name
				}
			}
		)
	}

	/**
	 * Adds component onto a button, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {string} component_name Component name
	 * @returns {Promise<"DeviceNotFound"|"FailedToAdd"|"Added">} Result of the operation
	 */
	add_component(serial_number, key, component_name) {
		return this.protocol.request(
			{
				ty: "add_component",
				data: {
					serial_number,
					key,
					component_name
				}
			}
		)
	}

	/**
	 * Gets component values for component from a button
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {string} component_name Component name
	 * @returns {Promise<?Array.<{name: string, display_name: string, ty: Object, value: Object}>>} Component values, null if component or device wasn't found
	 */
	get_component_values(serial_number, key, component_name) {
		return this.protocol.request(
			{
				ty: "get_component_values",
				data: {
					serial_number,
					key,
					component_name
				}
			}
		).then(data => {
			if (data.Values) {
				return data.Values;
			} else {
				return null;
			}
		})
	}

	/**
	 * Sets component values for a component on a button, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {string} component_name Component name
	 * @param {Array.<{name: string, display_name: string, ty: Object, value: Object}>} value Array of values
	 * @returns {Promise<"DeviceNotFound"|"FailedToGet"|"Set">} Result of the operation
	 */
	set_component_value(serial_number, key, component_name, value) {
		return this.protocol.request(
			{
				ty: "set_component_value",
				data: {
					serial_number,
					key,
					component_name,
					value
				}
			}
		)
	}

	/**
	 * Removes component from a button, commit the change later with commit_changes in order for this to get saved
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @param {string} component_name Component name 
	 * @returns {Promise<"DeviceNotFound"|"FailedToRemove"|"Removed">} Result of the operation
	 */
	remove_component(serial_number, key, component_name) {
		return this.protocol.request(
			{
				ty: "remove_component",
				data: {
					serial_number,
					key,
					component_name
				}
			}
		)
	}

	/**
	 * Pushes a new screen into device's screen stack
	 * @param {string} serial_number Serial number of the device
	 * @param {Object.<string, Object>} screen Screen object consisting of key indices and button objects
	 * @returns {Promise<"DeviceNotFound"|"Pushed">} Result of the operation
	 */
	push_screen(serial_number, screen) {
		return this.protocol.request(
			{
				ty: "push_screen",
				data: {
					serial_number,
					screen
				}
			}
		)
	}

	/**
	 * Pops a screen from device's screen stack, unless only one screen remaining
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"DeviceNotFound"|"OnlyOneRemaining"|"Popped">} Result of the operation
	 */
	pop_screen(serial_number) {
		return this.protocol.request(
			{
				ty: "pop_screen",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Pops a screen from device's screen stack, bypassing limit of pop_screen
	 * @param {string} serial_number Serial number of the device
	 * @returns {Promise<"DeviceNotFound"|"Popped">} Result of the operation
	 */
	force_pop_screen(serial_number) {
		return this.protocol.request(
			{
				ty: "force_pop_screen",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Replaces current screen with new one
	 * @param {string} serial_number Serial number of the device
	 * @param {Object.<string, Object>} screen Screen object consisting of key indices and button objects
	 * @returns {Promise<"DeviceNotFound"|"Replaced">} Result of the operation
	 */
	replace_screen(serial_number, screen) {
		return this.protocol.request(
			{
				ty: "replace_screen",
				data: {
					serial_number,
					screen
				}
			}
		)
	}

	/**
	 * Resets stack and pushes a screen
	 * @param {string} serial_number Serial number of the device
	 * @param {Object.<string, Object>} screen Screen object consisting of key indices and button objects
	 * @returns {Promise<"DeviceNotFound"|"Reset">} Result of the operation
	 */
	reset_stack(serial_number, screen) {
		return this.protocol.request(
			{
				ty: "reset_stack",
				data: {
					serial_number,
					screen
				}
			}
		)
	}

	/**
	 * Commits changes made with screen related functions to device config, so they can be saved by save_device_config. Must be either called after each change, or sequence of changes
	 * @param {serial} serial_number 
	 * @returns {Promise<"DeviceNotFound"|"Committed">} Result of the operation
	 */
	commit_changes(serial_number) {
		return this.protocol.request(
			{
				ty: "commit_changes",
				data: {
					serial_number
				}
			}
		)
	}

	/**
	 * Simulates a key press on the device
	 * @param {string} serial_number Serial number of the device
	 * @param {number} key Index of the key (0-255)
	 * @returns {Promise<"DeviceNotFound"|"Activated">} Result of the operation
	 */
	do_button_action(serial_number, key) {
		return this.protocol.request(
			{
				ty: "do_button_action",
				data: {
					serial_number,
					key
				}
			}
		)
	}

	/**
	 * Destroys the client
	 */
	destroy() {
		this.protocol.destroy();
	}
}


/**
 * Initializes a new Unix Domain Socket based Streamduck client
 * @param {{timeout: number?, reconnect: boolean?}?} opts Options for client. timeout - Request timeout, default 5000; reconnect - Automatically reconnects to daemon, default true
 * @returns {StreamduckClient} Client that might still be connecting, check with is_connected method
 */
exports.newUnixClient = function (opts) {
	let timeout = opts && opts.timeout !== undefined ? opts.timeout : 5000;
	let reconnect = opts && opts.reconnect !== undefined ? opts.reconnect : true;

	let protocol = {
		pool: {}
	};

	let collected_string = "";
	let client = null;

	let streamduck = new StreamduckClient(protocol);

	let rec = () => {
		client = net.createConnection("/tmp/streamduck.sock")
			.on('connect', async () => {
				let version = await streamduck.version();

				let client_version = "0.1";
				if (version !== client_version)
					console.log(`Daemon version doesn't match this client's version. Daemon is using ${version}, client is using ${client_version}`);

				console.log("Connected to Streamduck");
			})
			.on('data', data => {
				data = data.toString();
				collected_string += data;

				if (collected_string.includes("\u0004")) {
					collected_string.split("\u0004").forEach(json => {
						if (json) {
							try {
								let obj = JSON.parse(json);
								let callback = protocol.pool[obj.requester];

								if (callback) {
									callback(obj.data);
								}

								delete protocol.pool[obj.requester];
							} catch (e) {

							}
						}
					});

					collected_string = "";
				}
			})
			.on('error', _ => {
				if (client) {
					client.destroy()
				}
				client = null;
			})
			.on('close', _ => {
				if (client) {
					client.destroy()
				}
				client = null;
			});
	}

	protocol.request = (data) => {
		let requester = randomstring.generate();
		data.requester = requester;
		if (client) {
			client.write(JSON.stringify(data) + "\u0004");

			return new Promise((resolve, reject) => {
				let timer = setTimeout(() => {
					reject("Request timed out")
				}, timeout)

				protocol.pool[requester] = function (data) {
					clearTimeout(timer);
					resolve(data)
				};
			})
		} else {
			return new Promise((_, reject) => reject("Client not connected"));
		}
	}

	protocol.connected = () => {
		if (client != null) {
			return client.readyState === "open";
		} else {
			return false;
		}
	}

	protocol.destroy = () => {
		client.destroy();
	}

	rec();
	setInterval(() => {
		if (client == null && reconnect) {
			rec();
		}
	}, 2000);

	return streamduck;
}