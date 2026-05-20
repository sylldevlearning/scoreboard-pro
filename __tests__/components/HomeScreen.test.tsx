import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "@/app/index";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

describe("<HomeScreen>", () => {
  beforeEach(() => { mockPush.mockClear(); });

  const sports = [
    "Volleyball",
    "Hockey",
    "Tennis",
    "Rugby",
    "Football",
    "Basketball",
    "Cricket",
    "Baseball",
  ];

  it("renders all 8 sports", () => {
    const { getByText } = render(<HomeScreen />);
    sports.forEach((sport) => {
      expect(getByText(sport)).toBeTruthy();
    });
  });

  it("tapping Volleyball navigates to /volleyball/score", () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText("Volleyball"));
    expect(mockPush).toHaveBeenCalledWith("/volleyball/score");
  });

  it("tapping Football navigates to /football/score", () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText("Football"));
    expect(mockPush).toHaveBeenCalledWith("/football/score");
  });

  it("tapping Hockey navigates to /hockey/score", () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText("Hockey"));
    expect(mockPush).toHaveBeenCalledWith("/hockey/score");
  });

  it("tapping Tennis navigates to /tennis/score", () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText("Tennis"));
    expect(mockPush).toHaveBeenCalledWith("/tennis/score");
  });

  it("displays the Scoreboard title", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("🏆 Scoreboard")).toBeTruthy();
  });
});
