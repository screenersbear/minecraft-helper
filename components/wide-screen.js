// Wide screen: whether the screen is wide, like an iPad (700 pixels or more), so pictures can be drawn bigger.
// styles/wide.css lays those screens out wider too.
export const wideScreen = () => !!(window.matchMedia && window.matchMedia('(min-width: 700px)').matches);
