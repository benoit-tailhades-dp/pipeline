import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { StatutBase } from "./statut-base";

it("affiche l'état de la base", () => {
  render(<StatutBase etat="ok" />);

  expect(screen.getByRole("status").textContent).toBe("Base connectée");
});
