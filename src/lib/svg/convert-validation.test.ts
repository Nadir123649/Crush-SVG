import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { convertSchema } from "./convert-validation";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';
const FORMAT_MESSAGE = "Unsupported format. Currently supported: [png]";

describe("convertSchema format", () => {
    it("accepts png", () => {
        const result = convertSchema.safeParse({ svg, format: "png" });
        assert.ok(result.success);
        assert.equal(result.data.format, "png");
    });

    it("defaults to png when format is missing", () => {
        const result = convertSchema.safeParse({ svg });
        assert.ok(result.success);
        assert.equal(result.data.format, "png");
    });

    for (const format of ["webp", "jpeg", "exe", "", 123]) {
        it(`rejects ${JSON.stringify(format)}`, () => {
            const result = convertSchema.safeParse({ svg, format });
            assert.equal(result.success, false);
            assert.deepEqual(result.error?.flatten().fieldErrors.format, [FORMAT_MESSAGE]);
        });
    }
});
