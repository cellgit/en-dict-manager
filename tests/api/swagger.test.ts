/** @jest-environment node */

import { openApiDocument } from "@/lib/api/openapi";
import { GET as getSwagger } from "@/app/api/swagger/route";

describe("openApiDocument", () => {
  it("包含关键路径定义", () => {
    const paths = Object.keys(openApiDocument.paths ?? {});
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/v1/books",
        "/api/v1/books/{bookId}",
        "/api/v1/books/{bookId}/words",
        "/api/v1/words",
        "/api/v1/words/{id}",
        "/api/v1/imports/dry-run",
        "/api/v1/imports",
        "/api/clean-data",
        "/api/swagger"
      ])
    );
  });
});

describe("GET /api/swagger", () => {
  it("返回 OpenAPI 文档", async () => {
    const response = await getSwagger();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.openapi).toBe("3.0.3");
    expect(payload.info?.title).toBe("en-dict-manager API");
  });
});
