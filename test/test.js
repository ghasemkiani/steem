//	test
const {sutil} = require("@ghasemkiani/steembase/sutil");

var assert = require("assert");
describe("sutil", function () {
	describe("#toUpdateGlobals()", function () {
		it("should update globals without error", async function () {
			await sutil.toUpdateGlobals();
			assert.ok(true);
		}).timeout(30000);
	});
});
