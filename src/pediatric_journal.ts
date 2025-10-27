import { FormattingRule } from "./smarts.js";

export const rules = [
  new FormattingRule(
    "Abstract Length and Content",
    "Verify that the abstract is between 150 and 250 words. It must not contain undefined abbreviations or unspecified references. Detect section heading 'Abstract' and count word length while checking for abbreviations that are not defined elsewhere in the document.",
  ),

  new FormattingRule(
    "Figure Caption Formatting",
    "Each figure caption must begin with the term 'Fig.' in bold type, followed by the figure number (also bold). There should be no punctuation after the number or at the end of the caption. Verify figure captions follow this format and correspond to figures cited in the text sequentially (e.g., Fig. 1, Fig. 2, etc.).",
  ),

  new FormattingRule(
    "Reference Citation Style",
    "Ensure that all in-text citations use numbers enclosed in square brackets (e.g., [1], [2-4]) and that the reference list is numbered consecutively. Cross-check that every cited number appears in the reference list and that DOIs, when available, are provided as full links.",
  ),
  new FormattingRule("Some Bold Text Required", "Make sure that at least some text in the document is bold."),
];
