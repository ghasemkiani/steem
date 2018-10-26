//	@ghasemkiani/steembase/account

const {Base} = require("@ghasemkiani/commonbase/base");
const {cutil} = require("@ghasemkiani/commonbase/cutil");
const {quantity} = require("@ghasemkiani/commonbase/util/quantity");
const {sutil} = require("@ghasemkiani/steembase/sutil");
const {asset} = require("@ghasemkiani/steembase/asset");
const {Post} = require("@ghasemkiani/steembase/post");

class Account extends Base {
	// _username
	// _password
	// _auth
	// _data
	// _json_metadata

	get username() {
		return this._username;
	}
	set username(username) {
		this._username = username;
	}
	get password() {
		return this._password;
	}
	set password(password) {
		this._password = password;
	}
	get data() {
		if (!this._data) {
			this._data = {};
		}
		return this._data;
	}
	set data(data) {
		this._data = data;
	}
	get auth() {
		if (!this._auth) {
			if (this.username && this.password) {
				let roles = ["owner", "active", "posting", "memo"];
				let result = sutil.getPrivateKeys(this.username, this.password, roles);
				this._auth = {};
				roles.forEach(role => this._auth[role] = {
						address: result[role + "Pubkey"],
						key: result[role],
					});
			} else if ("id" in this.data) {
				this._auth = {
					"owner": {
						address: this.data["owner"].key_auths[0][0],
					},
					"active": {
						address: this.data["active"].key_auths[0][0],
					},
					"posting": {
						address: this.data["posting"].key_auths[0][0],
					},
					"memo": {
						address: this.data["memo_key"],
					},
				};
			} else {
				this._auth = {
					"owner": {},
					"active": {},
					"posting": {},
					"memo": {},
				};
			}
		}
		return this._auth;
	}
	set auth(auth) {
		if (!auth) {
			this._auth = null;
		} else {
			this._auth = {};
			let roles = ["owner", "active", "posting", "memo"];
			roles.forEach(role => Object.assign((this._auth[role] = {}), auth[role]));
		}
	}

	async toUpdateData(dontUpdateGlobals) {
		if(!dontUpdateGlobals) {
			await sutil.toUpdateGlobals();
		}
		this.data = (await sutil.toGetAccounts([this.username]))[0];
		return this;
	}

	get json_metadata() {
		if (!this._json_metadata) {
			try {
				this._json_metadata = JSON.parse(this.data.json_metadata);
			} catch (e) {
				this._json_metadata = {};
			}
		}
		return this._json_metadata;
	}
	set json_metadata(json_metadata) {
		this._json_metadata = json_metadata;
	}

	get id() {
		return Number(this.data.id);
	}
	get date_created() {
		return sutil.timeDate(this.data.created);
	}
	get date_last_account_update() {
		return sutil.timeDate(this.data.last_account_update);
	}
	get date_last_owner_update() {
		return sutil.timeDate(this.data.last_owner_update);
	}
	get date_last_account_recovery() {
		return sutil.timeDate(this.data.last_account_recovery);
	}
	get date_last_vote() {
		return sutil.timeDate(this.data.last_vote_time);
	}
	get date_last_post() {
		return sutil.timeDate(this.data.last_post);
	}
	get date_last_root_post() {
		return sutil.timeDate(this.data.last_root_post);
	}
	get post_count() {
		return Number(this.data.post_count);
	}
	get comment_count() {
		return Number(this.data.comment_count);
	}
	get voting_power() {
		return Number(this.data.voting_power) / 100;
	}
	get voting_power_now() {
		return Math.min(this.voting_power + (quantity.time().period(this.date_last_vote).u("day").n() * 20), 100);
	}
	tm_to_full() {
		return quantity.time().u("hr").n((100 - this.voting_power_now) * 1.2).u("min");
	}
	date_full() {
		return quantity.time().now().u("min").delta(this.tm_to_full().n()).date();
	}
	get sbd() {
		return sutil.assetNum(this.data.sbd_balance);
	}
	get steem() {
		return sutil.assetNum(this.data.balance);
	}
	get vests() {
		return sutil.assetNum(this.data.vesting_shares);
	}
	get vests_received() {
		return sutil.assetNum(this.data.received_vesting_shares);
	}
	get vests_delegated() {
		return sutil.assetNum(this.data.delegated_vesting_shares);
	}
	get vests_net() {
		return this.vests + this.vests_received - this.vests_delegated;
	}
	get sp() {
		return sutil.vestsToSP(this.vests);
	}
	get sp_received() {
		return sutil.vestsToSP(this.vests_received);
	}
	get sp_delegated() {
		return sutil.vestsToSP(this.vests_delegated);
	}
	get sp_net() {
		return sutil.vestsToSP(this.vests_net);
	}
	get reward_sbd() {
		return sutil.assetNum(this.data.reward_sbd_balance);
	}
	get reward_steem() {
		return sutil.assetNum(this.data.reward_steem_balance);
	}
	get reward_vests() {
		return sutil.assetNum(this.data.reward_vesting_balance);
	}
	get reward_sp() {
		return sutil.assetNum(this.data.reward_vesting_steem);
	}
	get curation_rewards() {
		return this.data.curation_rewards;
	}
	get posting_rewards() {
		return this.data.posting_rewards;
	}
	get curation_rewards_steem() {
		return sutil.vestsToSP(this.curation_rewards);
	}
	get posting_rewards_steem() {
		return sutil.vestsToSP(this.posting_rewards);
	}
	get reputation() {
		return Number(this.data.reputation);
	}
	get rep() {
		return sutil.rep(this.reputation);
	}
	rshares(weight) {
		if (cutil.isNil(weight)) {
			weight = 10000;
		}
		return 20000 * this.vests_net * (weight / 10000);
	}
	get vote_value() {
		return sutil.rsharesToSteem(this.rshares());
	}
	get vote_value_sbd() {
		return asset.steem(this.vote_value).sbd().n();
	}
	get vote_value_usd() {
		let half1 = asset.usd().steem(this.vote_value / 2).usd().n();
		let half2 = asset.usd().sbd(this.vote_value_sbd / 2).usd().n();
		return half1 + half2;
	}
	async toVote(post, weight) {
		if (cutil.isNil(weight)) {
			weight = 10000;
		}
		let wif = this.auth.posting.key;
		let voter = this.username;
		let author = post.author;
		let permlink = post.permlink;
		return await sutil.toVote(wif, voter, author, permlink, weight);
	}
	async toClaimRewardBalance(dontUpdateData, dontUpdateGlobals) {
		if(!dontUpdateData) {
			await this.toUpdateData(dontUpdateGlobals);
		}
		if(this.reward_sbd === 0 && this.reward_steem === 0 && this.reward_vests === 0) {
			throw new Error("Nothing to claim!");
		} else {
			let wif = this.auth.posting.key;
			let account = this.username;
			let rewardSteem = this.data.reward_steem_balance;
			let rewardSbd = this.data.reward_sbd_balance;
			let rewardVests = this.data.reward_vesting_balance;
			return await sutil.toClaimRewardBalance(wif, account, rewardSteem, rewardSbd, rewardVests);
		}
	}
	async toPowerUp(steem, to) {
		let wif = this.auth.active.key;
		let from = this.username;
		to = to || this.username;
		let amount = asset.steem(steem).s();
		return await sutil.toPowerUp(wif, from, to, amount);
	}
	async toPowerDown(vests) {
		return await sutil.toPowerDown(this.auth.active.key, this.username, asset.vests(vests).s());
	}
	encrypt(account, memo) {
		return sutil.encrypt(this.auth.memo.key, account.auth.memo.address, memo);
	}
	decrypt(memo) {
		return sutil.decrypt(this.auth.memo.key, memo);
	}
	async toTransfer(to, amount, memo) {
		let wif = this.auth.active.key;
		let from = this.username;
		if(/^#/.test(memo)) {
			let account = new Account({username: to});
			await account.toUpdateData();
			memo = this.encrypt(account, memo);
		}
		return await sutil.toTransfer(wif, from, to, amount, memo);
	}
	async toGetHistory(arg) {
		arg = Object.assign({
			username: this.username,
		}, arg);
		return await sutil.toGetAccountHistory(arg);
	}
	async toGetHistoryAsnc(arg) {
		arg = Object.assign({
			username: this.username,
		}, arg);
		return await sutil.toGetAccountHistoryAsnc(arg);
	}
	async toGetFollowers(toCallback, startFollower) {
		return await sutil.toGetFollowers(this.username, toCallback, startFollower);
	}
	async toGetFollowing(toCallback, startFollowing) {
		return await sutil.toGetFollowing(this.username, toCallback, startFollowing);
	}
	async toCheckFollower(follower) {
		return await sutil.toCheckFollower(this.username, follower);
	}
	async toCheckFollowing(following) {
		return await sutil.toCheckFollowing(this.username, following);
	}
	async toFollow(following) {
		return await sutil.toFollow(this.auth.posting.key, this.username, following);
	}
	async toUnfollow(following) {
		return await sutil.toUnfollow(this.auth.posting.key, this.username, following);
	}
	async toGetPosts(limit = 10) {
		let contents = await sutil.toGetPosts(this.username, limit);
		this.posts = contents.map(content => new Post({data: content}));
		for(let post of this.posts) {
			await post.toProcessData();
		}
	}
	async toGetBids(arg) {
		arg = Object.assign({
			post: null,
			days: 7,
		}, arg);
		let {post, days} = arg;
		let url = post ? post.url : null;
		let url_stub;
		if(!post) {
			url_stub = new Post().url_stub;
		}
		let date = post ? post.date_created || quantity.time().now().u("day").delta(-7).date() : quantity.time().now().u("day").delta(-days).date();
		let bids = [];
		let refunds = {};
		let from = this.username;
		await this.toGetHistory({
			onItem(item, items) {
				if(quantity.time().period(item.date, date).n() > 0) {
					items.end = true;
				} else if(item.op.kind === "transfer" && item.op.to === from) {
					let bot = item.op.from;
					let unit = sutil.assetUnit(item.op.amount);
					let n = sutil.assetNum(item.op.amount);
					if(!(bot in refunds)) {
						refunds[bot] = {};
						refunds[bot]["SBD"] = 0;
						refunds[bot]["STEEM"] = 0;
					}
					refunds[bot][unit] += n;
				} else if(item.op.kind === "transfer" && item.op.from === from && (post ? (item.op.memo === url) :  String(item.op.memo).startsWith(url_stub))) {
					let amount = item.op.amount;
					let bot = item.op.to;
					if(bot in refunds) {
						let unit = sutil.assetUnit(item.op.amount);
						let n = sutil.assetNum(item.op.amount);
						let delta = Math.min(refunds[bot][unit], n);
						refunds[bot][unit] -= delta;
						n -= delta;
						amount = asset.steem(amount).n(n);
					}
					bids.push({
						date: item.date,
						amount: amount,
						bot: item.op.to,
						url: item.op.memo,
					});
				}
			},
		});
		return bids;
	}
	async toCreateLimitOrder(orderid, amountToSell, minToReceive, fillOrKill, expiration) {
		let result;
		let wif = this.auth.active.key;
		let owner = this.username;
		result = await sutil.toCreateLimitOrder(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration);
		return result;
	}
	async toSell(steem, sbd) {
		let result;
		let wif = this.auth.active.key;
		let owner = this.username;
		let orderid = cutil.asInteger(quantity.time().now().u("sec").n());
		let amountToSell = asset.steem(steem).s();
		let minToReceive = asset.sbd(sbd).s();
		let fillOrKill = true;
		let expiration = cutil.asInteger(quantity.time().now().u("min").delta(5).u("sec").n());
		result = await sutil.toCreateLimitOrder(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration);
		return result;
	}
	async toPost(arg) {
		arg = Object.assign({
			permlink: null,
			title: null,
			body: null,
			tags: ["post"],
			format: "markdown",
			jsonMetadata: null,
		}, arg, {
			wif: this.auth.posting.key,
			author: this.username,
		});
		return await sutil.toPost(arg);
	}
	async toResteem(post) {
		return await sutil.toResteem(this.auth.posting.key, this.username, post.author, post.permlink);
	}
	async toDelegate(delegatee, vesting_shares) {
		let wif = this.auth.active.key;
		let delegator = this.username;
		return await sutil.toDelegate(wif, delegator, delegatee, vesting_shares);
	}
}

module.exports = {
	Account,
};
