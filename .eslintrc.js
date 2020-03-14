module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "globals": {
        "ENV": true,
        "LED1": "readonly",
        "SPI1": true,
        "SPI2": true,
        "getTime": "readonly",
        "E": "readonly",
        "pinMode": true,
        "digitalRead": true,
        "setWatch": true,
        "A0": true,
        "A1": true,
        "A2": true,
        "A3": true,
        "A4": true,
        "A5": true,
        "A6": true,
        "A7": true,
        "A8": true,
        "B0": true,
        "B8": true,
        "B9": true,
        "B10": true,
        "B13": true,
        "B14": true,
        "B15": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2017
    },
    "rules": {
        "no-var":         "error",
        "no-unreachable": "warn",
        "complexity":     [ "warn", 4  ],
        "max-depth":      [ "warn", 4  ],
        "max-params":     [ "warn", 6  ],
        "max-statements": [ "warn", 30 ],

        "no-console": "off",
        "no-debugger": "warn",

        "prefer-template":        "off",
        "consistent-return":      "error",
        "class-methods-use-this": "error",
        "no-warning-comments":    "warn",
        "no-unused-vars": [
            "off",
            { "argsIgnorePattern": "^_|onInit" }
        ],

        "default-case": [
            "error",
            { "commentPattern": "^skip\\sdefault" }
        ],
        "indent": [
            "warn",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-trailing-spaces": [
            "warn"
        ],
        "eol-last": "off",

        "quotes": [
            "warn",
            "single",
            { "allowTemplateLiterals": true }
        ],
        "semi": [
            "warn",
            "always"
        ],
    }
};
