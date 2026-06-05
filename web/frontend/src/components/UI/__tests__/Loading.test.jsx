/**
 * FILE: web/frontend/src/components/UI/__tests__/Loading.test.jsx
 * MỤC ĐÍCH: Unit tests cho UI Loading component
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Loading from "../Loading";

describe("Loading Component", () => {
  it("renders correctly and contains the loading spinner", () => {
    const { container } = render(<Loading />);
    
    // Find the spinner span
    const spinner = container.querySelector("span");
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("loading", "loading-spinner", "loading-lg", "text-primary");
  });
});
