//	@ghasemkiani/steembase/post

const {Base} = require("@ghasemkiani/commonbase/base");
const {sutil} = require("@ghasemkiani/steembase/sutil");
const {asset} = require("@ghasemkiani/steembase/asset");
const {cutil} = require("@ghasemkiani/commonbase/cutil");
const {quantity} = require("@ghasemkiani/commonbase/util/quantity");

class Post extends Base {
	// _uri
	// _author
	// _permlink
	// _tag
	// _url
	// _data
	// _json_metadata
	// _title
	// _body
	// _net_rshares
	// min
	// votes

	get uri() {
		return this._uri;
	}
	set uri(uri) {
		let result;
		if(result = /\/([^@#/]*)\/(@.*#)?@([^@#/]*)\/([^@#/]*)/.exec(uri)) {
			let tag = result[1];
			let author = result[3];
			let permlink = result[4];
			this._uri = `/${tag}/@${author}/${permlink}`;
		} else if(result = /^https?\:\/\/d\.tube\/(#!\/)?v\/([^@#/]*)\/([^@#/]*)$/.exec(uri)) {
			let tag = this.tag;
			let author = result[1];
			let permlink = result[2];
			this._uri = `/${tag}/@${author}/${permlink}`;
		} else {
			this._uri = null;
		}
	}
	get tag() {
		let regex = /\/([^@#/]*)\/(@.*#)?@([^@#/]*)\/([^@#/]*)/;
		let result = regex.exec(this.uri);
		return result ? result[1] : "tag";
	}
	set tag(tag) {
		this.uri = `/${cutil.asString(tag)}/@${this.author}/${this.permlink}`;
	}
	get author() {
		let regex = /\/([^@#/]*)\/(@.*#)?@([^@#/]*)\/([^@#/]*)/;
		let result = regex.exec(this.uri);
		return result ? result[3] : "";
	}
	set author(author) {
		this.uri = `/${this.tag}/@${cutil.asString(author)}/${this.permlink}`;
	}
	get permlink() {
		let regex = /\/([^@#/]*)\/(@.*#)?@([^@#/]*)\/([^@#/]*)/;
		let result = regex.exec(this.uri);
		return result ? result[4] : "";
	}
	set permlink(permlink) {
		this.uri = `/${this.tag}/@${this.author}/${cutil.asString(permlink)}`;
	}
	get urid() {
		return `@${this.author}/${this.permlink}`;
	}
	set urid(urid) {
		this.uri = `/${this.tag}/${urid}`;
	}
	get url_stub() {
		return "https://steemit.com";
	}
	get url() {
		return this.url_stub +  this.uri;
	}
	set url(url) {
		this.uri = url;
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

	async toUpdateData(dontUpdateGlobals) {
		if (!dontUpdateGlobals) {
			await sutil.toUpdateGlobals();
		}
		this.data = await sutil.toGetContent(this.author, this.permlink);
		await this.toProcessData();
		return this;
	}
	async toUpdateVotes(dontUpdateGlobals) {
		if (!dontUpdateGlobals) {
			await sutil.toUpdateGlobals();
		}
		this.data.active_votes = await sutil.toGetVotes(this.author, this.permlink);
		await this.toProcessData();
		return this;
	}
	async toProcessData(updateGlobals) {
		if (updateGlobals) {
			await sutil.toUpdateGlobals();
		}
		if (this.data.json_metadata) {
			this.json_metadata = JSON.parse(this.data.json_metadata);
			if (this.json_metadata.tags && this.json_metadata.tags.length > 0) {
				this.tag = this.json_metadata.tags[0];
			}
		}
		this.tag = this.data.category;
		this.author = this.data.author;
		this.permlink = this.data.permlink;
		this.title = this.data.title;
		this.body = this.data.body;
		let date_created = this.date_created;
		this.votes = [];
		this.data.active_votes.forEach(active_vote => this.addVote(active_vote));
		this.votes.forEach(vote => {
			vote.rwshares = vote.rshares / 4;
			if (vote.min < 30) {
				vote.rwshares *= vote.min / 30;
			}
			vote.reward = 0;
		});
		this.totrshares = this.votes.map(vote => vote.rshares).reduce((a, b) => a + b, 0);
		this.totrwshares = this.votes.map(vote => vote.rwshares).reduce((a, b) => a + b, 0);
		this.totweights = this.votes.map(vote => vote.weight).reduce((a, b) => a + b, 0);
		if (this.totweights !== 0) {
			this.votes.forEach(vote => {
				vote.reward = this.totrwshares * vote.weight / this.totweights;
				if (vote.min < 30) {
					vote.reward *= vote.min / 30;
				}
			});
		}

		this.votes.forEach(vote => {
			vote.wtrs = vote.weight == 0 || vote.rwshares == 0 ? 0 : (vote.weight / this.totweights) / (vote.rshares / this.totrshares);
		});

		this.votes.forEach(vote => {
			vote.rsstm = sutil.rsharesToSteem(vote.rshares);
			vote.rwstm = sutil.rsharesToSteem(vote.reward);
			vote.rssbd = asset.steem(vote.rsstm).sbd().n();
			vote.rwsbd = asset.steem(vote.rwstm).sbd().n();
		});
		this.totrsstm = this.votes.map(vote => vote.rsstm).reduce((a, b) => a + b, 0);
		this.totrwstm = this.votes.map(vote => vote.rwstm).reduce((a, b) => a + b, 0);
		this.totrssbd = asset.steem(this.totrsstm).sbd().n();
		this.totrwsbd = asset.steem(this.totrwstm).sbd().n();

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
	get tags() {
		return this.json_metadata.tags;
	}
	set tags(tags) {
		this.json_metadata.tags = tags;
		if(tags && tags.length > 0) {
			this.tag = tags[0];
		}
	}
	get id() {
		return Number(this.data.id);
	}
	get title() {
		return this._title;
	}
	set title(title) {
		this._title = title;
	}
	get body() {
		return this._body;
	}
	set body(body) {
		this._body = body;
	}
	get net_rshares() {
		if(cutil.isNil(this._net_rshares)) {
			this._net_rshares = this.data ? Number(this.data.net_rshares) : 0;
		}
		return this._net_rshares;
	}
	set net_rshares(net_rshares) {
		this._net_rshares = net_rshares;
	}
	get date_created() {
		return sutil.timeDate(this.data.created);
	}
	get min() {
		return quantity.time().period(this.date_created).u("min").n();
	}
	get date_last_update() {
		return sutil.timeDate(this.data.last_update);
	}
	get date_active() {
		return sutil.timeDate(this.data.active);
	}
	get date_last_payout() {
		return sutil.timeDate(this.data.last_payout);
	}
	get date_cashout_time() {
		return sutil.timeDate(this.data.cashout_time);
	}
	get date_max_cashout_time() {
		return sutil.timeDate(this.data.max_cashout_time);
	}
	addVote(active_vote) {
		let date_created = this.date_created;
		let vote = Object.assign({
			get min() {
				return quantity.time().period(date_created, this.time).u("min").n();
			},
			get rep() {
				return sutil.rep(this.reputation);
			}
		}, active_vote);
		vote.index = this.votes.length;
		vote.time = sutil.timeDate(vote.time);
		vote.reputation = Number(vote.reputation);
		vote.rshares = Number(vote.rshares);
		vote.weight = Number(vote.weight);
		this.votes.push(vote);
		return vote;
	}
	vote(account, percent, date) {
		if(cutil.isNil(percent)) {
			percent = 10000;
		}
		if(cutil.isNil(date)) {
			date = new Date();
		}
		if(!this.data.active_votes) {
			this.data.active_votes = [];
		}
		let rshares = account.rshares(percent);
		let weight = Math.sqrt(this.net_rshares + rshares) - Math.sqrt(this.net_rshares);
		this.net_rshares += rshares;
		let active_vote = {
			voter: account.username,
			weight: weight,
			rshares: rshares,
			percent: percent,
			reputation: account.reputation,
			time: sutil.timeStr(date),
		};
		this.data.active_votes.push(active_vote);
		return active_vote;
	}
	isComment() {
		return !!this.data.parent_author;
	}
	isVotedBy(account) {
		return this.votes.some(vote => vote.voter === account.username);
	}
}

module.exports = {
	Post,
};