import { Message, TemplateMessage } from "@line/bot-sdk"

export const DemoNoti: Message = {
    "type": "template",
    "altText": "this is a carousel template",
    "template": {
        "type": "carousel",
        "columns": [
            {
                "thumbnailImageUrl": "https://example.com/bot/images/item1.jpg",
                "imageBackgroundColor": "#FFFFFF",
                "title": "this is menu",
                "text": "description",
                "defaultAction": {
                    "type": "uri",
                    "label": "View detail",
                    "uri": "http://example.com/page/123"
                },
                "actions": [
                    {
                        "type": "postback",
                        "label": "Buy",
                        "data": "action=buy&itemid=111"
                    },
                    {
                        "type": "postback",
                        "label": "Add to cart",
                        "data": "action=add&itemid=111"
                    },
                    {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "http://example.com/page/111"
                    }
                ]
            },
            {
                "thumbnailImageUrl": "https://example.com/bot/images/item2.jpg",
                "imageBackgroundColor": "#000000",
                "title": "this is menu",
                "text": "description",
                "defaultAction": {
                    "type": "uri",
                    "label": "View detail",
                    "uri": "http://example.com/page/222"
                },
                "actions": [
                    {
                        "type": "postback",
                        "label": "Buy",
                        "data": "action=buy&itemid=222"
                    },
                    {
                        "type": "postback",
                        "label": "Add to cart",
                        "data": "action=add&itemid=222"
                    },
                    {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "http://example.com/page/222"
                    }
                ]
            }
        ],
        "imageAspectRatio": "rectangle",
        "imageSize": "cover"
    }
}

export const GreenFlex: Message = {
    "type": "flex",
    "altText": "This is a Flex Message",
    "contents": {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://img2.pic.in.th/pic/7ffa7302b2c19f7f759fadad457223b9.jpg",
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "ไม่พบความเสี่ยง",
                    "weight": "bold",
                    "size": "xl",
                    "wrap": true,
                },
                {
                    "type": "box",
                    "layout": "baseline",
                    "flex": 1,
                    "contents": [
                        {
                            "type": "text",
                            "text": "ขณะนี้ไม่พบความเสี่ยงภาวะซึมเศร้า ขอท่านหมั่นดูแลตนเองทั้งร่างกายและจิตใจให้สดชื่นแข็งแรงนะคะ",
                            "weight": "regular",
                            "size": "md",
                            "flex": 0,
                            "wrap": true,
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "xxl"
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
                    "weight": "bold",
                    "align": "start",
                    "wrap": true,
                }
            ]
        }
    }
}

export const YellowFlex: Message = {
    "type": "flex",
    "altText": "This is a Flex Message",
    "contents": {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://img5.pic.in.th/file/secure-sv1/-4f4b706e6ae0738b8.jpg",
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "พบความเสี่ยงระดับปานกลาง",
                    "weight": "bold",
                    "size": "lg",
                    "wrap": true,
                },
                {
                    "type": "box",
                    "layout": "baseline",
                    "contents": [
                        {
                            "type": "text",
                            "text": "พบความเสี่ยงภาวะซึมเศร้าในระดับปานกลาง แต่ไม่มีความ เสี่ยงฆ่าตัวตาย หากท่านต้องการพบนักจิตวิทยาสามารถทํานัดหมายผ่านระบบ telemed ผ่าน app หมอ กทม.",
                            "weight": "regular",
                            "size": "md",
                            "flex": 0,
                            "wrap": true,
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "xxl"
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
                    "weight": "bold",
                    "wrap": true,
                }
            ]
        }
    }
}

export const RedFlex: Message = {
    "type": "flex",
    "altText": "This is a Flex Message",
    "contents":
    {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://img2.pic.in.th/pic/-54acbf84ef21a74d4.jpg",
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "พบอาการซึมเศร้าระดับรุนแรง",
                    "weight": "bold",
                    "size": "lg",
                    "wrap": true,
                },
                {
                    "type": "box",
                    "layout": "baseline",
                    "flex": 1,
                    "contents": [
                        {
                            "type": "text",
                            "text": "ขณะนี้พบว่าท่านมีความเสี่ยงภาวะซึมเศร้าในระดับปานกลาง/รุนแรง และมีความเสี่ยงฆ่าตัวตาย รบกวนเวลาของท่านให้ข้อมูลส่วนตัวเพิ่มเติมเพื่อส่งต่อให้นักจิตวิทยาได้ติดต่อกลับค่ะ",
                            "weight": "regular",
                            "size": "md",
                            "flex": 0,
                            "wrap": true,
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "xxl"
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "หากต้องการข้อมูลเพิ่มเติมสามารถเข้ารับบริการได้ที่ สายด่วนสุขภาพจิต 1323",
                    "weight": "bold",
                    "wrap": true,
                }
            ]
        }
    }
}

export const EmergencyAlertFlex: Message = {
    "type": "flex",
    "altText": "This is a Flex Message",
    "contents":
    {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://img2.pic.in.th/pic/-6a089526f3e3d15dc.jpg",
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "text",
                    "text": "ชื่อ-นามสกุล",
                    "weight": "bold",
                    "size": "xl",
                    "wrap": true,
                },
                {
                    "type": "text",
                    "text": "เบอร์มือถือ",
                    "weight": "regular",
                    "size": "lg",
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "button",
                    "action": {
                        "type": "uri",
                        "label": "ปุ่มโทรฉุกเฉิน",
                        "uri": "https://linecorp.com"
                    },
                    "color": "#E72626FF",
                    "style": "primary"
                }
            ]
        }
    }
}