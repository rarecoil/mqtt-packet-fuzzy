/**
 * fuzzMaybe
 * 
 * Sets up the Radamsa fuzzer based upon environment variables.
 * Implements `fuzzMaybe`, which listens to these variables and uses
 * them to fuzz points in writeToStream.
 */

// Invoke configuration
const config = (function() {
    let options = {
        MQTT_FUZZ_ENABLE: false,
        MQTT_FUZZ_FLAGS: true,
        MQTT_FUZZ_HEADERS: true,
        MQTT_FUZZ_LENGTHS: true,
        MQTT_FUZZ_NUMBERS: true,
        MQTT_FUZZ_PROTOCOL_VERSION: true,
        MQTT_FUZZ_SEED: 'timestamp',
        MQTT_FUZZ_SHOW_IO: false,
        MQTT_FUZZ_SKIP_CONTAINING: '',
        MQTT_FUZZ_SKIP_FIRST_INPUTS: 0,
        MQTT_FUZZ_STRINGS: true
    };

    // override defaults with environment variables
    for (let key in process.env) {
        if (key.substr(0,10) === 'MQTT_FUZZ_') {
            if (key === "MQTT_FUZZ_SEED") {
                if (process.env[key] !== 'timestamp') {
                    options[key] = parseInt(process.env[key]);
                }
            }
            else if (key === 'MQTT_FUZZ_SKIP_FIRST_INPUTS') {
                options[key] = parseInt(process.env[key]);
            }
            else if (key === 'MQTT_FUZZ_SKIP_CONTAINING') {
                options[key] = process.env[key];
            }
            else {
                let value = process.env[key];
                options[key] = (value === '1' || value === 'true');
            }
        }
    }
    return options;
})();


// configure Radamsa
const Sinkdweller = require('sinkdweller');
const radamsa     = new Sinkdweller();
// set the radamsa seed function based on MQTT_FUZZ_SEED
if (config.MQTT_FUZZ_SEED === 'timestamp') {
    radamsa.setSeed(function() {
        // use the millisecond time as a generator
        return (new Date().getTime());
    });
} else {
    radamsa.setSeed(parseInt(config.MQTT_FUZZ_SEED));
}


var packetsFuzzed = 0; // total packets fuzzed, for MQTT_FUZZ_SKIP_FIRST_INPUTS

/**
 * Fuzzes input with Radamsa. Maybe.
 * 
 * @param {string|Buffer} input The input string/buffer to fuzz with Radamsa.
 * @param {string} inputKey The keyed name of the input, in order to flag it on/off.
 */
function fuzzMaybe(input, inputKey) {
    if (config.MQTT_FUZZ_ENABLE === true) {
        let fuzz_this = false;
        
        packetsFuzzed++; // incr. packets fuzzed
        if (config.MQTT_FUZZ_SKIP_FIRST_INPUTS > 0 && 
            packetsFuzzed <= config.MQTT_FUZZ_SKIP_FIRST_INPUTS) {
            // short circuit for beginning packets, return raw input
            return input;
        }
        else if (config.MQTT_FUZZ_SKIP_CONTAINING !== '') {
            // both buffer and string have .indexOf that operates similarly.
            fuzz_this = (input.indexOf(config.MQTT_FUZZ_SKIP_CONTAINING) === -1);
        }
        
        else if (inputKey === 'generic_number_cached' && config.MQTT_FUZZ_NUMBERS === true) {
            fuzz_this = true;
        }
        else if (inputKey === 'generic_string' && config.MQTT_FUZZ_STRINGS === true) {
            fuzz_this = true;
        }
        else if (inputKey.endsWith("header") && config.MQTT_FUZZ_HEADERS === true) {
            fuzz_this = true;
        }
        else if (inputKey.endsWith("flags") && config.MQTT_FUZZ_FLAGS === true) {
            fuzz_this = true;
        }
        else if (inputKey === 'connect_protocol_version' && config.MQTT_FUZZ_PROTOCOL_VERSION === true) {
            fuzz_this = true;
        }
        if (fuzz_this === true) {
            if (config.MQTT_FUZZ_SHOW_IO === true) {
                console.debug("in:  <\n", input);
                console.debug("--------------");
            }
            input = radamsa.fuzzSync(input);
            if (config.MQTT_FUZZ_SHOW_IO === true) {
                console.debug("out: >\n", input);
                console.debug("==============");
            }
            
        }
    }

    return input;
}


exports = module.exports = {
    fuzzMaybe: fuzzMaybe,
    fuzz: radamsa.fuzzSync,
    radamsa: radamsa
}