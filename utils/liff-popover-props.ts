/**
 * Popover defaults for HeroUI Select/Autocomplete inside LINE LIFF.
 * LIFF WebView often scrolls the page on tap; HeroUI closes the list on
 * outside scroll — shouldBlockScroll prevents that race.
 */
export const liffPopoverProps = {
  shouldBlockScroll: true,
  placement: "bottom" as const,
  offset: 4,
};
