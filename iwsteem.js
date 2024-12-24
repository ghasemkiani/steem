import { cutil } from "@ghasemkiani/base";

import { Account } from "./account.js";

const iwsteem = {
  defaultPrefsIWSteem: {
    username: null,
    kPassword: null,
    addressOwner: null,
    addressActive: null,
    addressPosting: null,
    addressMemo: null,
    kKeyOwner: null,
    kKeyActive: null,
    kKeyPosting: null,
    kKeyMemo: null,
  },
  // pass: null,
  _username: null,
  _kPassword: null,
  _password: null,
  _addressOwner: null,
  _addressActive: null,
  _addressPosting: null,
  _addressMemo: null,
  _kKeyOwner: null,
  _kKeyActive: null,
  _kKeyPosting: null,
  _kKeyMemo: null,
  _keyOwner: null,
  _keyActive: null,
  _keyPosting: null,
  _keyMemo: null,
  _account: null,
  get username() {
    if (cutil.na(this._username) && cutil.a(this.prefs.username)) {
      this._username = this.prefs.username;
    }
    return this._username;
  },
  set username(username) {
    this._username = username;
  },
  get kPassword() {
    if (cutil.na(this._kPassword)) {
      this._kPassword = this.prefs.kPassword;
    }
    return this._kPassword;
  },
  set kPassword(kPassword) {
    this._kPassword = kPassword;
  },
  get password() {
    if (cutil.na(this._password) && cutil.a(this.kPassword)) {
      this._password = this.pass.get(this.kPassword);
    }
    return this._password;
  },
  set password(password) {
    this._password = password;
  },
  get addressOwner() {
    if (cutil.na(this._addressOwner) && cutil.a(this.prefs.addressOwner)) {
      this._addressOwner = this.prefs.addressOwner;
    }
    return this._addressOwner;
  },
  set addressOwner(addressOwner) {
    this._addressOwner = addressOwner;
  },
  get addressActive() {
    if (cutil.na(this._addressActive) && cutil.a(this.prefs.addressActive)) {
      this._addressActive = this.prefs.addressActive;
    }
    return this._addressActive;
  },
  set addressActive(addressActive) {
    this._addressActive = addressActive;
  },
  get addressPosting() {
    if (cutil.na(this._addressPosting) && cutil.a(this.prefs.addressPosting)) {
      this._addressPosting = this.prefs.addressPosting;
    }
    return this._addressPosting;
  },
  set addressPosting(addressPosting) {
    this._addressPosting = addressPosting;
  },
  get addressMemo() {
    if (cutil.na(this._addressMemo) && cutil.a(this.prefs.addressMemo)) {
      this._addressMemo = this.prefs.addressMemo;
    }
    return this._addressMemo;
  },
  set addressMemo(addressMemo) {
    this._addressMemo = addressMemo;
  },
  get kKeyOwner() {
    if (cutil.na(this._kKeyOwner)) {
      this._kKeyOwner = this.prefs.kKeyOwner;
    }
    return this._kKeyOwner;
  },
  set kKeyOwner(kKeyOwner) {
    this._kKeyOwner = kKeyOwner;
  },
  get kKeyActive() {
    if (cutil.na(this._kKeyActive)) {
      this._kKeyActive = this.prefs.kKeyActive;
    }
    return this._kKeyActive;
  },
  set kKeyActive(kKeyActive) {
    this._kKeyActive = kKeyActive;
  },
  get kKeyPosting() {
    if (cutil.na(this._kKeyPosting)) {
      this._kKeyPosting = this.prefs.kKeyPosting;
    }
    return this._kKeyPosting;
  },
  set kKeyPosting(kKeyPosting) {
    this._kKeyPosting = kKeyPosting;
  },
  get kKeyMemo() {
    if (cutil.na(this._kKeyMemo)) {
      this._kKeyMemo = this.prefs.kKeyMemo;
    }
    return this._kKeyMemo;
  },
  set kKeyMemo(kKeyMemo) {
    this._kKeyMemo = kKeyMemo;
  },
  get keyOwner() {
    if (cutil.na(this._keyOwner) && cutil.a(this.kKeyOwner)) {
      this._keyOwner = this.pass.get(this.kKeyOwner);
    }
    return this._keyOwner;
  },
  set keyOwner(keyOwner) {
    this._keyOwner = keyOwner;
  },
  get keyActive() {
    if (cutil.na(this._keyActive) && cutil.a(this.kKeyActive)) {
      this._keyActive = this.pass.get(this.kKeyActive);
    }
    return this._keyActive;
  },
  set keyActive(keyActive) {
    this._keyActive = keyActive;
  },
  get keyPosting() {
    if (cutil.na(this._keyPosting) && cutil.a(this.kKeyPosting)) {
      this._keyPosting = this.pass.get(this.kKeyPosting);
    }
    return this._keyPosting;
  },
  set keyPosting(keyPosting) {
    this._keyPosting = keyPosting;
  },
  get keyMemo() {
    if (cutil.na(this._keyMemo) && cutil.a(this.kKeyMemo)) {
      this._keyMemo = this.pass.get(this.kKeyMemo);
    }
    return this._keyMemo;
  },
  set keyMemo(keyMemo) {
    this._keyMemo = keyMemo;
  },
  get account() {
    if (cutil.na(this._account)) {
      this._account = new Account({
        username: this.username,
        password: this.password,
        auth: {
          owner: {
            address: this.addressOwner,
            key: this.keyOwner,
          },
          active: {
            address: this.addressActive,
            key: this.keyActive,
          },
          posting: {
            address: this.addressPosting,
            key: this.keyPosting,
          },
          memo: {
            address: this.addressMemo,
            key: this.keyMemo,
          },
        },
      });
    }
    return this._account;
  },
  set account(account) {
    this._account = account;
  },
  async toDefineInitOptionsIWSteem() {
    let app = this;
    app.commander.option(
      "--set-username <username>",
      "set username persistently",
    );
    app.commander.option("--username <username>", "set username");
    app.commander.option(
      "--set-k-password <kPassword>",
      "set pass key for password persistently",
    );
    app.commander.option(
      "-k, --k-password <kPassword>",
      "set pass key for password",
    );
    app.commander.option("-P, --password <password>", "set password");
    app.commander.option(
      "--set-address-owner <addressOwner>",
      "set owner address persistently",
    );
    app.commander.option("--address-owner <addressOwner>", "set owner address");
    app.commander.option(
      "--set-address-active <addressActive>",
      "set active address persistently",
    );
    app.commander.option(
      "--address-active <addressActive>",
      "set active address",
    );
    app.commander.option(
      "--set-address-active <addressActive>",
      "set active address persistently",
    );
    app.commander.option(
      "--address-active <addressActive>",
      "set active address",
    );
    app.commander.option(
      "--set-address-posting <addressPosting>",
      "set posting address persistently",
    );
    app.commander.option(
      "--address-posting <addressPosting>",
      "set posting address",
    );
    app.commander.option(
      "--set-address-memo <addressMemo>",
      "set memo address persistently",
    );
    app.commander.option("--address-memo <addressMemo>", "set memo address");
    app.commander.option(
      "--set-k-key-owner <kKeyOwner>",
      "set pass key for owner key persistently",
    );
    app.commander.option(
      "--k-key-owner <kKeyOwner>",
      "set pass key for owner key",
    );
    app.commander.option("--key-owner <keyOwner>", "set owner key");
    app.commander.option(
      "--set-k-key-active <kKeyActive>",
      "set pass key for active key persistently",
    );
    app.commander.option(
      "--k-key-active <kKeyActive>",
      "set pass key for active key",
    );
    app.commander.option("--key-active <keyActive>", "set active key");
    app.commander.option(
      "--set-k-key-posting <kKeyPosting>",
      "set pass key for posting key persistently",
    );
    app.commander.option(
      "--k-key-posting <kKeyPosting>",
      "set pass key for posting key",
    );
    app.commander.option("--key-posting <keyPosting>", "set posting key");
    app.commander.option(
      "--set-k-key-memo <kKeyMemo>",
      "set pass key for memo key persistently",
    );
    app.commander.option(
      "--k-key-memo <kKeyMemo>",
      "set pass key for memo key",
    );
    app.commander.option("--key-memo <keyMemo>", "set memo key");
  },
  async toApplyInitOptionsIWSteem() {
    let app = this;
    let opts = app.commander.opts();
    if (cutil.a(opts.setUsername)) {
      app.username = null;
      app.prefs.username = opts.setUsername;
    }
    if (cutil.a(opts.username)) {
      app.username = opts.username;
    }
    if (cutil.a(opts.setAddressOwner)) {
      app.addressOwner = null;
      app.prefs.addressOwner = opts.setAddressOwner;
    }
    if (cutil.a(opts.addressOwner)) {
      app.addressOwner = opts.addressOwner;
    }
    if (cutil.a(opts.setAddressActive)) {
      app.addressActive = null;
      app.prefs.addressActive = opts.setAddressActive;
    }
    if (cutil.a(opts.addressActive)) {
      app.addressActive = opts.addressActive;
    }
    if (cutil.a(opts.setAddressPosting)) {
      app.addressPosting = null;
      app.prefs.addressPosting = opts.setAddressPosting;
    }
    if (cutil.a(opts.addressPosting)) {
      app.addressPosting = opts.addressPosting;
    }
    if (cutil.a(opts.setAddressMemo)) {
      app.addressMemo = null;
      app.prefs.addressMemo = opts.setAddressMemo;
    }
    if (cutil.a(opts.addressMemo)) {
      app.addressMemo = opts.addressMemo;
    }
    if (cutil.a(opts.setKPassword)) {
      app.kPassword = null;
      app.prefs.kPassword = opts.setKPassword;
    }
    if (cutil.a(opts.kPassword)) {
      app.kPassword = opts.kPassword;
    }
    if (cutil.a(opts.password)) {
      app.password = opts.password;
    }
    if (cutil.a(opts.setKKeyOwner)) {
      app.kKeyOwner = null;
      app.prefs.kKeyOwner = opts.setKKeyOwner;
    }
    if (cutil.a(opts.kKeyOwner)) {
      app.kKeyOwner = opts.kKeyOwner;
    }
    if (cutil.a(opts.keyOwner)) {
      app.keyOwner = opts.keyOwner;
    }
    if (cutil.a(opts.setKKeyActive)) {
      app.kKeyActive = null;
      app.prefs.kKeyActive = opts.setKKeyActive;
    }
    if (cutil.a(opts.kKeyActive)) {
      app.kKeyActive = opts.kKeyActive;
    }
    if (cutil.a(opts.keyActive)) {
      app.keyActive = opts.keyActive;
    }
    if (cutil.a(opts.setKKeyPosting)) {
      app.kKeyPosting = null;
      app.prefs.kKeyPosting = opts.setKKeyPosting;
    }
    if (cutil.a(opts.kKeyPosting)) {
      app.kKeyPosting = opts.kKeyPosting;
    }
    if (cutil.a(opts.keyPosting)) {
      app.keyPosting = opts.keyPosting;
    }
    if (cutil.a(opts.setKKeyMemo)) {
      app.kKeyMemo = null;
      app.prefs.kKeyMemo = opts.setKKeyMemo;
    }
    if (cutil.a(opts.kKeyMemo)) {
      app.kKeyMemo = opts.kKeyMemo;
    }
    if (cutil.a(opts.keyMemo)) {
      app.keyMemo = opts.keyMemo;
    }
  },
};

export { iwsteem };
