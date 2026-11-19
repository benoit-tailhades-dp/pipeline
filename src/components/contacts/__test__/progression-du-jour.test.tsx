import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressionDuJour } from "../progression-du-jour";

describe("ProgressionDuJour", () => {
  it("affiche « 1 sur 5 » avec 1 relance faite sur 5", () => {
    render(<ProgressionDuJour faites={1} total={5} />);

    screen.getByText("1 sur 5 traitée aujourd’hui");
    const barre = screen.getByRole("progressbar", { name: "Relances du jour" });
    expect(barre.getAttribute("aria-valuenow")).toBe("1");
    expect(barre.getAttribute("aria-valuemax")).toBe("5");
  });

  it("accorde au pluriel", () => {
    render(<ProgressionDuJour faites={3} total={5} />);

    screen.getByText("3 sur 5 traitées aujourd’hui");
  });

  it("ne s'affiche pas quand il n'y a rien à faire aujourd'hui", () => {
    const { container } = render(<ProgressionDuJour faites={0} total={0} />);

    expect(container.textContent).toBe("");
  });
});
