import { FlexMessage } from "@line/bot-sdk";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Teen Mind",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    rpp: "https://www.rpphosp.go.th/",
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};

export const GreenFlex: FlexMessage = {
  type: "flex",
  altText: "ผลประเมินภาวะซึมเศร้า",
  contents: {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/7ffa7302b2c19f7f759fadad457223b9.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "ไม่พบความเสี่ยง",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
            {
              type: "box",
              layout: "baseline",
              flex: 1,
              contents: [
                {
                  type: "text",
                  text: "ขณะนี้ไม่พบความเสี่ยงภาวะซึมเศร็า ขอท่านหมั่นดูแลตนเอง ทั้งร่างกายและจิตใจให้สดชื่นแข็งแรงนะคะ",
                  weight: "regular",
                  size: "md",
                  flex: 0,
                  wrap: true,
                },
              ],
            },
            {
              type: "separator",
              margin: "xxl",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
              weight: "bold",
              align: "start",
              wrap: true,
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/-380c9732d402da5f0.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "แอพหมอ. กทม.",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=com.msd.bma&hl=th&pli=1",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/%E0%B8%AB%E0%B8%A1%E0%B8%AD-%E0%B8%81%E0%B8%97%E0%B8%A1/id1600388607",
              },
              style: "primary",
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/-70a854123a6de2944.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "Application OOCA",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
            {
              type: "text",
              text: "ดาวน์โหลดฟรี",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=co.ooca.user&hl=th",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/ooca-%E0%B8%9B%E0%B8%A3-%E0%B8%81%E0%B8%A9%E0%B8%B2%E0%B8%9B-%E0%B8%8D%E0%B8%AB%E0%B8%B2%E0%B9%83%E0%B8%88/id1260476046",
              },
              style: "primary",
            },
          ],
        },
      },
    ],
  },
};

export const YellowFlex: FlexMessage = {
  type: "flex",
  altText: "ผลประเมินภาวะซึมเศร้า",
  contents: {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/-4f4b706e6ae0738b8.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "พบความเสี่ยงระดับปานกลาง",
              weight: "bold",
              size: "lg",
              wrap: true,
            },
            {
              type: "box",
              layout: "baseline",
              contents: [
                {
                  type: "text",
                  text: "พบความเสี่ยงภาวะซึมเศร้าในระดับปานกลาง แต่ไม่มีความเสี่ยงฆ่าตัวตาย หากท่านต้องการพบนักจิตวิทยาสามารถทํานัดหมายผ่านระบบ telemed ผ่าน app หมอ กทม.",
                  weight: "regular",
                  size: "md",
                  flex: 0,
                  wrap: true,
                },
              ],
            },
            {
              type: "separator",
              margin: "xxl",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
              weight: "bold",
              wrap: true,
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/-380c9732d402da5f0.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "แอพหมอ. กทม.",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=com.msd.bma&hl=th&pli=1",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/%E0%B8%AB%E0%B8%A1%E0%B8%AD-%E0%B8%81%E0%B8%97%E0%B8%A1/id1600388607",
              },
              style: "primary",
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/-70a854123a6de2944.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "Application OOCA",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
            {
              type: "text",
              text: "ดาวน์โหลดฟรี",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=co.ooca.user&hl=th",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/ooca-%E0%B8%9B%E0%B8%A3-%E0%B8%81%E0%B8%A9%E0%B8%B2%E0%B8%9B-%E0%B8%8D%E0%B8%AB%E0%B8%B2%E0%B9%83%E0%B8%88/id1260476046",
              },
              style: "primary",
            },
          ],
        },
      },
    ],
  },
};

export const RedFlex: FlexMessage = {
  type: "flex",
  altText: "ผลประเมินภาวะซึมเศร้า",
  contents: {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/-54acbf84ef21a74d4.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "พบอาการซึมเศร้าระดับรุนแรง",
              weight: "bold",
              size: "lg",
              wrap: true,
            },
            {
              type: "box",
              layout: "baseline",
              flex: 1,
              contents: [
                {
                  type: "text",
                  text: "ขณะนี้พบว่าท่านมีความเสี่ยงภาวะซึมเศร้าในระดับปานกลาง/รุนแรง และมีความเสี่ยงฆ่าตัวตาย รบกวนเวลาของท่านให้ข้อมูลส่วนตัวเพิ่มเติมเพื่อส่งต่อให้นักจิตวิทยาได้ติดต่อกลับค่ะ",
                  weight: "regular",
                  size: "md",
                  flex: 0,
                  wrap: true,
                },
              ],
            },
            {
              type: "separator",
              margin: "xxl",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
              weight: "bold",
              wrap: true,
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/-380c9732d402da5f0.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "แอพหมอ. กทม.",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=com.msd.bma&hl=th&pli=1",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/%E0%B8%AB%E0%B8%A1%E0%B8%AD-%E0%B8%81%E0%B8%97%E0%B8%A1/id1600388607",
              },
              style: "primary",
            },
          ],
        },
      },
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/-70a854123a6de2944.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "Application OOCA",
              weight: "bold",
              size: "xl",
              wrap: true,
            },
            {
              type: "text",
              text: "ดาวน์โหลดฟรี",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "Android",
                uri: "https://play.google.com/store/apps/details?id=co.ooca.user&hl=th",
              },
              style: "primary",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "IOS",
                uri: "https://apps.apple.com/th/app/ooca-%E0%B8%9B%E0%B8%A3-%E0%B8%81%E0%B8%A9%E0%B8%B2%E0%B8%9B-%E0%B8%8D%E0%B8%AB%E0%B8%B2%E0%B9%83%E0%B8%88/id1260476046",
              },
              style: "primary",
            },
          ],
        },
      },
    ],
  },
};

export const EmergencyAlertFlex = ({
  name,
  tel,
}: {
  name: string;
  tel: string;
}) => {
  ({
    type: "flex",
    altText:
      "ขณะนี้พบผู้ประเมินที่มีความเสี่ยงภาวะซึมเศร้าในระดับปานกลาง/รุนแรง",
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: "https://img2.pic.in.th/pic/-6a089526f3e3d15dc.jpg",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: { name },
            weight: "bold",
            size: "xl",
            wrap: true,
          },
          {
            type: "text",
            text: { tel },
            weight: "regular",
            size: "lg",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "ปุ่มโทรฉุกเฉิน",
              uri: "https://linecorp.com",
            },
            color: "#E72626FF",
            style: "primary",
          },
        ],
      },
    },
  });
};
