import { FlexMessage } from "@line/bot-sdk";

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
          url: "https://img2.pic.in.th/pic/green.jpeg",
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
          url: "https://img5.pic.in.th/file/secure-sv1/red9fc363b01b1e6818.jpeg",
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
          url: "https://img5.pic.in.th/file/secure-sv1/yellowcb878d777cff5017.jpeg",
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
              text: "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายดวนสุขภาพจิต 1323",
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

export const GreenLowFlex: FlexMessage = {
  type: "flex",
  altText: "ผลประเมินภาวะซึมเศร้า",
  contents: {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img2.pic.in.th/pic/green.jpeg",
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
              text: "พบความเสี่ยงเล็กน้อย",
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
                  text: "พบความเสี่ยงภาวะซึมเศร้าในระดับเล็กน้อย ขอให้ท่านหมั่นดูแลตนเอง ทั้งร่างกายและจิตใจให้สดชื่นแข็งแรง และหากมีอาการเพิ่มเติมสามารถติดต่อสายด่วนสุขภาพจิตได้",
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

export const OrangeFlex: FlexMessage = {
  type: "flex",
  altText: "ผลประเมินภาวะซึมเศร้า",
  contents: {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://img5.pic.in.th/file/secure-sv1/orange.jpeg",
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
              text: "พบความเสี่ยงมาก",
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
                  text: "พบความเสี่ยงภาวะซึมเศร้าในระดับมาก ขอให้ท่านติดต่อนักจิตวิทยาหรือจิตแพทย์เพื่อรับการประเมินและรักษาที่เหมาะสม",
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

/** สร้าง Flex Message (bubble) แจ้งเตือน Admin เมื่อมีผู้ประเมินได้คะแนน Red พร้อม link หน้า /admin/alert/[id] */
export function getEmergencyAlertFlex(
  name: string,
  tel: string,
  alertCaseUrl?: string
): FlexMessage {
  const telUri = `tel:${tel.replace(/\s/g, "")}`;
  const footerButtons = [
    {
      type: "button" as const,
      action: {
        type: "uri" as const,
        label: "โทรฉุกเฉิน",
        uri: telUri,
      },
      color: "#E72626FF",
      style: "primary" as const,
    },
    ...(alertCaseUrl
      ? [
          {
            type: "button" as const,
            action: {
              type: "uri" as const,
              label: "ดูรายละเอียดเคส",
              uri: alertCaseUrl,
            },
            style: "primary" as const,
          },
        ]
      : []),
  ];

  return {
    type: "flex",
    altText: "แจ้งเตือน: ผู้ประเมินที่มีความเสี่ยงภาวะซึมเศร้าในระดับรุนแรง",
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
            text: "แจ้งเตือน: พบความเสี่ยงระดับรุนแรง (Red)",
            weight: "bold",
            size: "xl",
            wrap: true,
          },
          {
            type: "text",
            text: `ชื่อ-นามสกุล: ${name}`,
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "text",
            text: `เบอร์โทร: ${tel}`,
            weight: "regular",
            size: "lg",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: footerButtons,
      },
    },
  };
}
