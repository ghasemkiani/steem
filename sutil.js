//	@ghasemkiani/steembase/sutil

const CoinMarketCap = require("coinmarketcap-api");
const {Base} = require("@ghasemkiani/commonbase/base");
const {cutil} = require("@ghasemkiani/commonbase/cutil");
const {quantity} = require("@ghasemkiani/commonbase/util/quantity");

class SUtil extends Base {
	get url() {
		if (!this._url) {
			this._url = process.env.STEEM_NODE || this.URLS[0];
		}
		return this._url;
	}
	set url(url) {
		this._url = url;
		if (url && this._steem) {
			this._steem.api.setOptions({url: url});
		}
	}
	get steem() {
		if (!this._steem) {
			this._steem = global.steem ? global.steem : require("steem");
			if(this.url) {
				this._steem.api.setOptions({url: this.url});
			}
		}
		return this._steem;
	}
	set steem(steem) {
		this._steem = steem;
	}
	reset() {
		this._steem = null;
		return this;
	}
	assetNum(str) {
		return parseFloat(str);
	}
	assetUnit(str) {
		return String(str).split(" ")[1];
	}
	assetStr(num, unit) {
		return Number(num).toFixed(/VESTS/.test(unit) ? 6 : 3) + " " + unit;
	}
	timeDate(str) {
		return new Date(str + "Z");
	}
	timeStr(date) {
		return date.toISOString().toLowerCase().slice(0, -1).slice(0, -4).toUpperCase();
	}
	getPrivateKeys(username, password, roles) {
		return this.steem.auth.getPrivateKeys(username, password, roles);
	}
	async toStart() {
		await this.steem.api.start();
	}
	async toStop() {
		await this.steem.api.stop();
	}
	async toGetConfig() {
		this.config = await this.steem.api.getConfigAsync();
		return this.config;
	}
	async toGetChainProperties() {
		this.chainProperties = await this.steem.api.getChainPropertiesAsync();
		return this.chainProperties;
	}
	async toGetDynamicGlobalProperties() {
		this.dynamicGlobalProperties = await this.steem.api.getDynamicGlobalPropertiesAsync();
		return this.dynamicGlobalProperties;
	}
	async toGetCurrentMedianHistoryPrice() {
		this.currentMedianHistoryPrice = await this.steem.api.getCurrentMedianHistoryPriceAsync();
		this.price = parseFloat(this.currentMedianHistoryPrice.base) / parseFloat(this.currentMedianHistoryPrice.quote);
		return this.currentMedianHistoryPrice;
	}
	async toGetRewardFund() {
		this.rewardFund = await this.steem.api.getRewardFundAsync("post");
		return this.rewardFund;
	}
	async toGetInternalMarketPrice() {
		let orders = await this.steem.api.getOrderBookAsync(1);
		let price_ask = cutil.asNumber(orders.asks[0].real_price);
		let price_bid = cutil.asNumber(orders.bids[0].real_price);
		let price = (price_ask + price_bid) / 2;
		this.price_steem_sbd = price;
	}
	async toGetCoinMarketCapPrices() {
		let cmc = new CoinMarketCap({version: "v2"});
		let ticker;

		ticker = await cmc.getTicker({currency: "BTC"});
		this.price_btc_usd = ticker.data.quotes.USD.price;

		ticker = await cmc.getTicker({currency: "STEEM"});
		this.price_steem_usd = ticker.data.quotes.USD.price;
		this.price_steem_btc = this.price_steem_usd / this.price_btc_usd;

		ticker = await cmc.getTicker({currency: "SBD"});
		this.price_sbd_usd = ticker.data.quotes.USD.price;
		this.price_sbd_btc = this.price_sbd_usd / this.price_btc_usd;
	}
	async toUpdateGlobals() {
		await this.toGetDynamicGlobalProperties();
		await this.toGetCurrentMedianHistoryPrice();
		await this.toGetRewardFund();
		if(this.cmc) {
			await this.toGetCoinMarketCapPrices();
		}
		await this.toGetInternalMarketPrice();
		return this;
	}
	vestsToSP(vests) {
		vests = this.assetNum(vests);
		let totVests = this.assetNum(this.dynamicGlobalProperties.total_vesting_shares);
		let totSteem = this.assetNum(this.dynamicGlobalProperties.total_vesting_fund_steem);
		return vests * totSteem / totVests;
	}
	spToVests(sp) {
		sp = this.assetNum(sp);
		let totVests = this.assetNum(this.dynamicGlobalProperties.total_vesting_shares);
		let totSteem = this.assetNum(this.dynamicGlobalProperties.total_vesting_fund_steem);
		return sp * totVests / totSteem;
	}
	rsharesToSteem(rshares) {
		rshares = this.assetNum(rshares);
		let reward_balance = this.assetNum(this.rewardFund.reward_balance);
		let recent_claims = this.assetNum(this.rewardFund.recent_claims);
		return rshares * reward_balance / recent_claims;
	}
	rep(reputation) {
		return !reputation ? 25 : (Math.log10(reputation) - 9) * 9 + 25;
	}
	reputation(rep) {
		return Math.pow(10, ((rep - 25) / 9) + 9);
	}
	async toTransfer(wif, from, to, amount, memo) {
		return await this.steem.broadcast.transferAsync(wif, from, to, amount, memo);
	}
	async toPowerUp(wif, from, to, amount) {
		return await this.steem.broadcast.transferToVestingAsync(wif, from, to, amount);
	}
	async toPowerDown(wif, account, vestingShares) {
		return await this.steem.broadcast.withdrawVestingAsync(wif, account, vestingShares);
	}
	async toDelegate(wif, delegator, delegatee, vesting_shares) {
		return await this.steem.broadcast.delegateVestingSharesAsync(wif, delegator, delegatee, vesting_shares);
	}
	async toGetAccounts(names) {
		return await this.steem.api.getAccountsAsync(names);
	}
	async toVote(wif, voter, author, permlink, weight) {
		return await this.steem.broadcast.voteAsync(wif, voter, author, permlink, weight);
	}
	async toGetContent(author, permlink) {
		return await this.steem.api.getContentAsync(author, permlink);
	}
	async toGetVotes(author, permlink) {
		return await this.steem.api.getActiveVotesAsync(author, permlink);
	}
	async toCreateLimitOrder(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration) {
		return await this.steem.broadcast.limitOrderCreateAsync(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration);
	}
	async toCancelLimitOrder(wif, owner, orderid) {
		return await this.steem.broadcast.limitOrderCancelAsync(wif, owner, orderid);
	}
	async toClaimRewardBalance(wif, account, rewardSteem, rewardSbd, rewardVests) {
		return await this.steem.broadcast.claimRewardBalanceAsync(wif, account, rewardSteem, rewardSbd, rewardVests);
	}
	async toGetAccountHistory(arg) {
		arg = Object.assign({
			username: null,
			from: -1,
			limit: 100,
			count: -1,
			forward: false,
			onItem (item, items) {},
		}, arg);
		let items = [];
		let username = arg.username;
		let from = arg.from;
		let limit = arg.limit;
		loop:
		while(true) {
			let batch = await this.steem.api.getAccountHistoryAsync(username, arg.forward ? from + limit : from, (!arg.forward && from !== -1 && from < limit) ? from : limit);
			batch = batch.map(data => {
				let item = data.reduce((a, b) => ((b.id = a), b));
				item.op = item.op.reduce((a, b) => ((b.kind = a), b));
				item.date = this.timeDate(item.timestamp);
				return item;
			});
			if (arg.forward) {
				while(batch.length > 0 && batch[0].id < from) {
					batch = batch.slice(1);
				}
			}
			if (batch.length === 0) {
				break loop;
			}
			if (!arg.forward) {
				batch.reverse();
				from = batch[batch.length - 1].id - 1;
			} else {
				from = batch[batch.length - 1].id + 1;
			}
			for (let item of batch) {
				let ret = arg.onItem(item, items);
				if (!item.discard) {
					items.push(item);
				}
				if (items.end || items.length === arg.count) {
					break loop;
				}
			}
			if (from === -1) {
				break loop;
			}
		}
		return items;
	}
	async toGetAccountHistoryAsnc(arg) {
		arg = Object.assign({
			username: null,
			from: -1,
			limit: 100,
			count: -1,
			forward: false,
			async onItem (item, items) {},
		}, arg);
		let items = [];
		let username = arg.username;
		let from = arg.from;
		let limit = arg.limit;
		loop:
		while(true) {
			let batch = await this.steem.api.getAccountHistoryAsync(username, arg.forward ? from + limit : from, (!arg.forward && from !== -1 && from < limit) ? from : limit);
			batch = batch.map(data => {
				let item = data.reduce((a, b) => ((b.id = a), b));
				item.op = item.op.reduce((a, b) => ((b.kind = a), b));
				item.date = this.timeDate(item.timestamp);
				return item;
			});
			if (arg.forward) {
				while(batch.length > 0 && batch[0].id < from) {
					batch = batch.slice(1);
				}
			}
			if (batch.length === 0) {
				break loop;
			}
			if (!arg.forward) {
				batch.reverse();
				from = batch[batch.length - 1].id - 1;
			} else {
				from = batch[batch.length - 1].id + 1;
			}
			for (let item of batch) {
				let ret = await arg.onItem(item, items);
				if (!item.discard) {
					items.push(item);
				}
				if (items.end || items.length === arg.count) {
					break loop;
				}
			}
			if (from === -1) {
				break loop;
			}
		}
		return items;
	}
	get appName() {
		if (!this._appName) {
			this._appName = "steemit/0.1";
		}
		return this._appName;
	}
	set appName(appName) {
		this._appName = appName;
	}
	async toComment(wif, parentAuthor, parentPermlink, author, permlink, body, jsonMetadata) {
		let title = "";
		jsonMetadata = JSON.stringify(Object.assign({
				tags: [],
				app: this.appName,
				format: "markdown",
			}, jsonMetadata));
		return await this.steem.broadcast.commentAsync(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata);
	}
	async toPost(arg) {
		arg = Object.assign({
			wif: null,
			author: null,
			permlink: null,
			title: null,
			body: null,
			tags: ["post"],
			app: this.appName,
			format: "markdown",
			jsonMetadata: null,
		}, arg);
		let {wif, author, permlink, title, body, tags, app, format, jsonMetadata} = arg;
		if (cutil.isString(tags)) {
			tags = tags.trim().split(/\s+/g);
		}
		let parentAuthor = "";
		let mainCategory = tags[0];
		jsonMetadata = JSON.stringify(Object.assign({
				tags: tags,
				app: app,
				format: format,
			}, jsonMetadata));
		return await this.steem.broadcast.commentAsync(wif, parentAuthor, mainCategory, author, permlink, title, body, jsonMetadata);
	}
	async toGetFollowers(username, toCallback, startFollower) {
		let following = username;
		let followType = "blog";
		let limit = 100;
		let followers = [];
		// let startFollower = null;
		let array;
		let hasNext;
		do {
			array = await this.steem.api.getFollowersAsync(following, startFollower, followType, limit).map(item => item.follower);
			hasNext = array.length === limit;
			if (startFollower && startFollower === array[0]) {
				array = array.slice(1);
			}
			followers = followers.concat(array);
			if(toCallback) {
				for(let username of array) {
					await toCallback(username);
				}
			}
			startFollower = array[array.length - 1];
		} while (hasNext);
		return followers;
	}
	async toGetFollowing(username, toCallback, startFollowing) {
		let follower = username;
		let followType = "blog";
		let limit = 100;
		let following = [];
		// let startFollowing = null;
		let array;
		let hasNext;
		do {
			array = await this.steem.api.getFollowingAsync(follower, startFollowing, followType, limit).map(item => item.following);
			hasNext = array.length === limit;
			if (startFollowing && startFollowing === array[0]) {
				array = array.slice(1);
			}
			following = following.concat(array);
			if(toCallback) {
				for(let username of array) {
					await toCallback(username);
				}
			}
			startFollowing = array[array.length - 1];
		} while (hasNext);
		return following;
	}
	async toCheckFollower(following, follower) {
		let followType = "blog";
		let limit = 1;
		let startFollower = follower;
		let array = await this.steem.api.getFollowersAsync(following, startFollower, followType, limit).map(item => item.follower);
		return array[0] === follower;
	}
	async toCheckFollowing(follower, following) {
		let followType = "blog";
		let limit = 1;
		let startFollowing = following;
		let array = await this.steem.api.getFollowingAsync(follower, startFollowing, followType, limit).map(item => item.following);
		return array[0] === following;
	}
	isValidUsername(username) {
		if (!username) {
			return false;
		}
		username = String(username);
		if (username.length < 3 || username.length > 16) {
			return false;
		}
		for(let part of username.split(".")) {
			if (!/^[a-z][a-z0-9-]+[a-z0-9]$/.test(part) || /--/.test(part)) {
				return false;
			}
		}
		return true;
	}
	async toFollow(wif, follower, following) {
		if (!following) {
			throw new Error("Invalid 'following'.")
		}
		follower = String(follower).trim();
		following = String(following).trim();
		if (!this.isValidUsername(following)) {
			throw new Error("Invalid 'following'.")
		}
		if (follower === following) {
			return false;
		}
		if (await this.toCheckFollowing(follower, following)) {
			return false;
		}
		let followType = "blog";
		let result = await this.steem.broadcast.customJsonAsync(wif, [], [follower], "follow", JSON.stringify(["follow", {follower, following, what: [followType]}]));
		return JSON.parse(result.operations[0][1].json)[1].following === following;
	}
	async toUnfollow(wif, follower, following) {
		if (!await this.toCheckFollowing(follower, following)) {
			return false;
		}
		let result = await this.steem.broadcast.customJsonAsync(wif, [], [follower], "follow", JSON.stringify(["follow", {follower, following, what: []}]));
		return result;
	}
	async toGetPosts(username, limit = 10) {
		let contents = await this.steem.api.getDiscussionsByBlogAsync({
			tag: username,
			limit: limit,
		});
		contents = contents.filter(content => content.author === username);
		return contents;
	}
	async toGetState(path = "/") {
		return await this.steem.api.getStateAsync(path);
	}
	async toGetLastBlockNumber() {
		return (await this.steem.api.getDynamicGlobalPropertiesAsync()).head_block_number;
	}
	async toGetLastIrreversibleBlockNumber() {
		return (await this.steem.api.getDynamicGlobalPropertiesAsync()).last_irreversible_block_num;
	}
	async toGetBlock(blockNumber, noVirtual) {
		let block = await this.steem.api.getBlockAsync(blockNumber);
		if(block) {
			block.date = this.timeDate(block.timestamp);
			block.transactions.forEach(item => {
				if (item.operations[0]) {
					item.op = item.operations[0].reduce((a, b) => ((b.kind = a), b));
				} else {
					item.op = {kind: ""};
				}
			});
			if(!noVirtual) {
				block.ops = await this.steem.api.getOpsInBlockAsync(blockNumber, true);
				block.ops.forEach(item => {
					item.op = item.op.reduce((a, b) => ((b.kind = a), b));
					block.transactions.push(item);
				});
			}
		}
		return block;
	}
	async toBrowseBlocks(arg) {
		arg = Object.assign({
			blockNumber: null,
			offset: 0,
			async toProcessBlock(block) {},
			async toProcessItem(item, block) {},
			stop: false,
		}, arg);
		if (!arg.blockNumber) {
			arg.blockNumber = await this.toGetLastBlockNumber() + arg.offset;
		}
		while(!arg.stop) {
			try {
				// console.log(arg.blockNumber);
				let block = await this.toGetBlock(arg.blockNumber);
				if (block) {
					await arg.toProcessBlock(block);
					for(let item of block.transactions) {
						if (arg.stop) {
							break;
						}
						await arg.toProcessItem(item, block);
					}
					if (!arg.stop) {
						++arg.blockNumber;
						let date = quantity.time().date(block.date).u("sec").delta(3).date();
						// console.log(quantity.time().period(date).u("ms").n());
						await quantity.time().period(new Date(), date).toSchedule();
					}
				} else {
					await quantity.time().u("sec").n(0.5).toSchedule();
				}
			} catch(e) {
				console.log(e.message);
			}
		};
	}
	async toGetVestsPriceAtBlock(blockNumber) {
		if(!blockNumber) {
			blockNumber = await this.toGetLastBlockNumber();
		}
		let price;
		loop:
		for(let bn = blockNumber; bn > 0; bn--) {
			let block = await this.toGetBlock(bn--);
			for(let item of block.transactions) {
				if(item.op.kind === "fill_vesting_withdraw" && parseFloat(item.op.withdrawn) > 0) {
					price = parseFloat(item.op.deposited) / parseFloat(item.op.withdrawn);
					break loop;
				}
			}
		}
		if(!price) {
			loop:
			while(true) {
				let block = await this.toGetBlock(blockNumber++);
				for(let item of block.transactions) {
					if(item.op.kind === "fill_vesting_withdraw" && parseFloat(item.op.withdrawn) > 0) {
						price = parseFloat(item.op.deposited) / parseFloat(item.op.withdrawn);
						break loop;
					}
				}
			}
		}
		return price;
	}
	async toGetPostsByTag(arg) {
		if (cutil.isString(arg)) {
			arg = {tag: arg};
		}
		arg = Object.assign({
			tag: "science",
			limit: 100,
			count: 100,
			start_author: null,
			start_permlink: null,
		}, arg);
		arg.limit = Math.min(arg.limit, arg.count);
		let contents = [];
		let tag = arg.tag;
		let limit = arg.limit;
		let count = arg.count;
		let start_author = arg.start_author;
		let start_permlink = arg.start_permlink;
		while(contents.length < count) {
			limit = Math.min(limit, count - contents.length + 1);
			limit = Math.max(limit, 2);
			let batch = await this.steem.api.getDiscussionsByCreatedAsync({tag, limit, start_author, start_permlink});
			if (!batch && batch.length === 0) {
				break;
			}
			if (start_author) {
				batch = batch.slice(1);
			}
			start_author = batch[batch.length - 1].author;
			start_permlink = batch[batch.length - 1].permlink;
			console.log(batch.map(content => content.id));
			contents = contents.concat(batch);
		}
		return contents;
	}
	async toResteem(wif, account, author, permlink) {
		return await this.steem.broadcast.customJsonAsync(wif, [], [account], "follow", JSON.stringify(["reblog", {account, author, permlink}]));
	}
	async toGetTransaction(trxId) {
		return await this.steem.api.getTransactionAsync(trxId);
	}
	async toGetAccountCreationFee() {
		await this.toGetConfig();
		await this.toGetChainProperties();
		return this.config.STEEMIT_CREATE_ACCOUNT_WITH_STEEM_MODIFIER * this.assetNum(this.chainProperties.account_creation_fee);
	}
}
cutil.extend(SUtil.prototype, {
	URLS: [
		"https://steemd.pevo.science",
		"https://steemd.privex.io",
		"https://api.steemit.com",
		"https://rpc.steemliberator.com",
		"https://gtg.steem.house:8090",
		"https://steemd.minnowsupportproject.org",
		"https://rpc.buildteam.io",
		"wss://steemd.pevo.science",
		"wss://steemd.privex.io",
		"wss://steemd.minnowsupportproject.org",
		"wss://rpc.steemviz.com",
		"wss://gtg.steem.house:8090",
	],
	_appName: null,
	_url: null,
	_steem: null,
	config: null,
	chainProperties: null,
	dynamicGlobalProperties: null,
	currentMedianHistoryPrice: null,
	price: null,
	price_steem_usd: null,
	price_steem_btc: null,
	price_sbd_usd: null,
	price_sbd_btc: null,
	cmc: true,
});

let sutil = new SUtil();

module.exports = {
	SUtil,
	sutil,
};
