import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    color: {
      violet: "from-[#FF1CF7] to-[#b249f8]",
      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
    },
    size: {
      xs: "text-xl lg:text-2xl",
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl leading-9",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      color: [
        "violet",
        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",
        "foreground",
      ],
      class: "bg-clip-text text-transparent bg-gradient-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-600 block max-w-full",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});

export const SidebarWrapper = tv({
  base: "bg-background transition-transform h-full fixed -translate-x-full w-64 shrink-0 z-[202] overflow-y-auto border-r border-divider flex-col py-6 px-3 md:ml-0 md:flex md:static md:h-screen md:translate-x-0 ",

  variants: {
    collapsed: {
      true: "translate-x-0 ml-0 pt-20 [display:inherit]",
    },
  },
});

export const Overlay = tv({
  base: "bg-[rgb(15_23_42/0.3)] fixed inset-0 z-[201] opacity-80 transition-opacity md:hidden md:z-auto md:opacity-100",
});

export const Header = tv({
  base: "flex gap-8 items-center px-6",
});

export const Body = tv({
  base: "flex flex-col gap-6 mt-9 px-2",
});

export const Footer = tv({
  base: "flex items-center justify-center gap-6 pt-16 pb-8 px-8 md:pt-10 md:pb-0",
});

export const Sidebar = Object.assign(SidebarWrapper, {
  Header,
  Body,
  Overlay,
  Footer,
});

export const StyledBurgerButton = tv({
  base: "absolute flex flex-col justify-around w-6 h-6 bg-transparent border-none cursor-pointer padding-0 z-[202] focus:outline-none [&_div]:w-6 [&_div]:h-px [&_div]:bg-default-900 [&_div]:rounded-xl  [&_div]:transition-all  [&_div]:relative  [&_div]:origin-[1px] ",

  variants: {
    open: {
      true: "[&",
    },
  },
});
