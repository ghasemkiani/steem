import { Obj } from "@ghasemkiani/base";
import { cutil } from "@ghasemkiani/base";
import { Quantity } from "@ghasemkiani/base-utils";
import { sutil } from "./sutil.js";

class Asset extends Quantity {
  constructor(...args) {
    if (args.length === 1 && typeof args[0] === "number") {
      args[0] = cutil.asString(args[0]);
    }
    super(...args);
  }
  toString() {
    let decimals = this.unit === "USD" ? 2 : this.unit === "VESTS" ? 6 : 3;
    return this.sFixed(decimals);
  }
  async toReset() {
    await sutil.toUpdateGlobals();
    this.kmap = null;
    return this;
  }
  defUnit() {
    return "STEEM";
  }
  defKMap() {
    return {
      STEEM: 1,
      SBD: 1 / sutil.price,
      VESTS: sutil.vestsToSP(1),
      USD: 1 / sutil.price_steem_usd,
    };
  }
  steem(n) {
    return this.u("STEEM").fromString(n);
  }
  sbd(n) {
    return this.u("SBD").fromString(n);
  }
  vests(n) {
    return this.u("VESTS").fromString(n);
  }
  usd(n) {
    return this.u("USD").fromString(n);
  }
  async toApplyVestsPriceAtBlock(blockNumber) {
    let unit = this.defUnit();
    let price = await sutil.toGetVestsPriceAtBlock(blockNumber);
    if (unit === "VESTS") {
      this.kMap.STEEM = 1 / price;
      this.kMap.SBD = 1 / (price * sutil.price);
      this.kMap.USD = 1 / (price * sutil.price_steem_usd);
    } else if (unit === "STEEM") {
      this.kMap.VESTS = price;
    } else if (unit === "SBD") {
      this.kMap.VESTS = (1 / price) * sutil.price;
    }
    return this;
  }
}

class Steem extends Asset {
  //
}

class SBD extends Asset {
  defUnit() {
    return "SBD";
  }
  defKMap() {
    return {
      SBD: 1,
      STEEM: sutil.price,
      VESTS: sutil.vestsToSP(1) * sutil.price,
      USD: 1 / (sutil.price_steem_usd / sutil.price_steem_sbd),
    };
  }
}

class Vests extends Asset {
  defUnit() {
    return "VESTS";
  }
  defKMap() {
    return {
      VESTS: 1,
      STEEM: sutil.spToVests(1),
      SBD: sutil.spToVests(1 / sutil.price),
      USD: sutil.spToVests(1 / sutil.price_steem_usd),
    };
  }
}

class USD extends Asset {
  defUnit() {
    return "USD";
  }
  defKMap() {
    return {
      USD: 1,
      STEEM: sutil.price_steem_usd,
      SBD: sutil.price_steem_usd / sutil.price_steem_sbd,
      VESTS: sutil.vestsToSP(1) * sutil.price_steem_usd,
    };
  }
}

let asset = new (class extends Obj {
  async toUpdate() {
    await sutil.toUpdateGlobals();
    return this;
  }
  steem(...args) {
    return new Steem(...args);
  }
  sbd(...args) {
    return new SBD(...args);
  }
  vests(...args) {
    return new Vests(...args);
  }
  async toGetVestsAtBlock(blockNumber) {
    let asset = new Vests();
    await asset.toApplyVestsPriceAtBlock(blockNumber);
    return asset;
  }
  usd(...args) {
    return new USD(...args);
  }
  authorRatio() {
    return 0.5 + this.usd().sbd(this.steem(0.5).sbd().n()).steem().n();
  }
})();

export { Asset, Steem, SBD, Vests, asset };
