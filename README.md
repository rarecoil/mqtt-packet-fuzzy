# mqtt-packet-fuzzy

### A radamsa fuzzer-enabled version of mqtt-packet@5.6.0 for testing.

`mqtt-packet-fuzzy` is a fork of
[mqttjs/mqtt-packet](https://github.com/mqttjs/mqtt-packet)@5.6.0 which
instruments the `writeToStream` functionality of `mqtt-packet` with a
[radamsa](https://gitlab.com/akihe/radamsa)-backed fuzzing system. This
allows security testers to fuzz MQTT protocols without having to dump
testcases, circumvent pinning, strip TLS, et cetera. Take a real Node.js
MQTT client that depends on `mqtt-packet@^5.0.0`, replace `mqtt-packet`
with this package, and let the low-level hooking do all the fuzzing for you.

`mqtt-packet-fuzzy` does not require an existing radamsa fuzzer to be
on the device path; it uses
[sinkdweller](https://github.com/rarecoil/sinkdweller) to handle radamsa
offload, which works on Windows, Linux and macOS at the time of this
writing.

## Usage

For an existing client that uses `mqtt-packet`, do a normal `npm
install`. Then, remove the `mqtt-packet` in the `node_modules` folder
and replace it with the contents of this repository. Since it *is*
mqtt-packet, nothing changes except for its output. Then, simply enable
the fuzzing for your client with the environment variable:

````bash
$ MQTT_FUZZ_ENABLE=1 node /path/to/my/client.js
````

Most of the fuzzer code is in `fuzzMaybe.js`.


### Customizing the fuzzer

In order to stay as much out of the way as possible but still allow
customization, `mqtt-packet-fuzzy` options can be modified by using
environment variables. This allows your tests to omit some packet types,
payloads, or specific strings, which may be useful to get further down a
logic tree than you would get simply spewing MQTT chaos over the
wire.


#### Enabling the fuzzer

* **MQTT_FUZZ_ENABLE** &mdash; {0, 1} &mdash; Whether or not to enable the fuzzer. The fuzzer will not run unless `MQTT_FUZZ_ENABLE=1`. *Default: __0__*

#### Protocol-specific options (default all to `1` (on))

* **MQTT_FUZZ_FLAGS** &mdash; {0, 1} &mdash; Fuzz MQTT control flags.
* **MQTT_FUZZ_HEADERS** &mdash; {0, 1} &mdash; Fuzz control headers. 
* **MQTT_FUZZ_LENGTHS** &mdash; {0, 1} &mdash; Fuzz packet lengths.
* **MQTT_FUZZ_NUMBERS** &mdash; {0, 1} &mdash; Fuzz any number being written.
* **MQTT_FUZZ_PROTOCOL_VERSION** &mdash; {0, 1} &mdash; Fuzz protocol versions.
* **MQTT_FUZZ_STRINGS** &mdash; {0, 1} &mdash; Fuzz strings (payloads).

#### Fuzzer control options

* **MQTT_FUZZ_SEED** &mdash; {'timestamp', Number} &mdash; Set the radamsa seed. `timestamp` will use the current timestamp from `new Date().getTime()` as the radamsa seed. This is useful for fuzzing when you can see logs on the other side and correlate crashes to timestamps, as it helps in reproducing a testcase. *Default __timestamp__*
* **MQTT_FUZZ_SHOW_IO** &mdash; {0, 1} &mdash; Show input/output on `console.debug`. Useful when using traceback to save or parse testcases. *Default __0__*
* **MQTT_FUZZ_SKIP_CONTAINING** &mdash; {String} &mdash; Skip any strings containing this string, and do not fuzz the input. This is useful to skip over auth tokens, etc. where you may need to have them complete to move further in the broker logic. *Default __''__*
* **MQTT_FUZZ_SKIP_FIRST_INPUTS** &mdash; {Number} &mdash; Skip the first _n_ inputs. Useful for running the fuzzer where the beginning few MQTT messages need to be proper in order to set up a connection and do more. *Default __0__*



## License

&copy; 2019 rarecoil. MIT.
