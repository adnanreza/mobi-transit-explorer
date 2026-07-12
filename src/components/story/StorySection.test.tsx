import { render, screen } from "@testing-library/react";
import { StorySection } from "@/components/story/StorySection";
import { chapters } from "@/components/story/storyContent";

describe("StorySection", () => {
  it("renders all chapters with headline, chart, and caption", () => {
    render(<StorySection />);

    for (const chapter of chapters) {
      expect(
        screen.getByRole("heading", { name: chapter.headline }),
      ).toBeInTheDocument();
      expect(screen.getByText(chapter.caption)).toBeInTheDocument();
    }
  });

  it("marks each chapter as an article", () => {
    render(<StorySection />);

    expect(screen.getAllByRole("article")).toHaveLength(chapters.length);
  });

  it("each story chart exposes the chapter caption as its accessible name", () => {
    render(<StorySection />);

    for (const chapter of chapters) {
      // The chart container carries role="img" with aria-label = chapter.caption
      expect(screen.getByRole("img", { name: chapter.caption })).toBeInTheDocument();
    }
  });
});
