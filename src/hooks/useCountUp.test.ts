import { renderHook } from "@testing-library/react";
import { parseFormattedNumber, useCountUp } from "@/hooks/useCountUp";

describe("parseFormattedNumber", () => {
  it("parses the four real overview formats", () => {
    expect(parseFormattedNumber("8,077,430")).toEqual({
      prefix: "",
      target: 8_077_430,
      decimals: 0,
      suffix: "",
    });
    expect(parseFormattedNumber("23.2M km")).toEqual({
      prefix: "",
      target: 23.2,
      decimals: 1,
      suffix: "M km",
    });
    expect(parseFormattedNumber("262")).toEqual({
      prefix: "",
      target: 262,
      decimals: 0,
      suffix: "",
    });
    expect(parseFormattedNumber("42%")).toEqual({
      prefix: "",
      target: 42,
      decimals: 0,
      suffix: "%",
    });
  });

  it("returns null for the em-dash placeholder", () => {
    expect(parseFormattedNumber("—")).toBeNull();
  });
});

describe("useCountUp", () => {
  it("shows the final value immediately in test mode", () => {
    const { result } = renderHook(() => useCountUp("8,077,430"));
    expect(result.current.display).toBe("8,077,430");
  });

  it("passes unparseable values through untouched", () => {
    const { result } = renderHook(() => useCountUp("—"));
    expect(result.current.display).toBe("—");
  });
});
