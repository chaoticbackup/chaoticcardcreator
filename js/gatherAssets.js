import { available_icons } from "./parseTextArea.js";

/** @type {Map<string, HTMLImageElement>} */
const loaded = new Map();

/** 
    This function ensures that all images have been loaded before proceeding
    Stores previously loaded images to speed up subsequent loads
*/
export async function loadAssets(common_config, type_config) {
    const assets = {};
    const promises = gatherAssets(common_config, type_config).map((img) => {
        return new Promise((resolve) => {
            const [key, value] = Object.entries(img)[0];
            if (loaded.has(value)) {
                assets[key] = loaded.get(value);
                resolve();
            } else {
                const loadable = new Image();
                loadable.onload = (() => {
                    assets[key] = loadable;
                    loaded.set(value, loadable);
                    resolve();
                });
                loadable.src = value;
            }
        });
    });

    await Promise.all(promises);
    return assets;
}

const find_icons = /(:[^ ]*:)|({{[^ }]*}})/g;

/** 
    This function maps what images need to be loaded based on the configuration 
    Modify this in accordance to the form's data and img folder layout
*/
function gatherAssets(common_config, type_config) {
    const assets = [];

    if (common_config.art) {
        assets.push({ art: common_config.art });
    }
    
    if (common_config.set) {
        assets.push({ symbol: `img/set/${common_config.set}${common_config.rarity}.png` });
    }

    if (common_config.type === "creature") {
        if (type_config.tribe) {
            if(common_config.subtype && common_config.subtype.toLowerCase().includes("minion")) {
                assets.push({ card: `img/template/${type_config.tribe}bw.png` });
            } else {
                assets.push({ card: `img/template/${type_config.tribe}.png` });
            }
        }  
        if (type_config.fire) {
            assets.push({ firecreature: "img/firecreature.png" });
        }

        if (type_config.air) {
            assets.push({ aircreature: "img/aircreature.png" });
        }
    
        if (type_config.earth) {
            assets.push({ earthcreature: "img/earthcreature.png" });
        }
    
        if (type_config.water) {
            assets.push({ watercreature: "img/watercreature.png" });
        }
    }

    if (common_config.type === "battlegear") {
        assets.push({ card: "img/template/battlegear.png" });
    }

    if (common_config.type === "attack") {
        assets.push({ card: "img/template/attack.png" });

        if (type_config.firedamage) {
            assets.push({ fireattack: "img/fireattack.png" });
        }
    
        if (type_config.airdamage) {
            assets.push({ airattack: "img/airattack.png" });
        }
    
        if (type_config.earthdamage) {
            assets.push({ earthattack: "img/earthattack.png" });
        }
    
        if (type_config.waterdamage) {
            assets.push({ waterattack: "img/waterattack.png" });
        } 
    }
    
    /* Loads all the icons to be used in the card */
    const icons = new Set();
    const mc = new Set();

    const parse = (text) => {
        const matches = text.match(find_icons);
        if (matches) {
            matches.forEach((icon) => {
                if (icon.startsWith(":")) {
                    icon = icon.replaceAll(":", "").toLowerCase();
                    if (available_icons.includes(icon)) {
                        icons.add(icon);
                    }
                }
                else if (icon.startsWith("{{")) {
                    mc.add(icon.replace("{{", "").replace("}}", "").toLowerCase());
                }
            });
        }
    };

    let tribe = "generic";
    if (type_config.tribe && type_config.tribe !== "tribeless") {
        tribe = type_config.tribe;
    }

    if (common_config.ability) {
        common_config.ability = preParseText(common_config.ability, tribe);
        parse(common_config.ability);
    }

    if (type_config.brainwashed) {
        type_config.brainwashed = preParseText(type_config.brainwashed, tribe);
        parse(type_config.brainwashed);
    }

    if (type_config.initiative) {
        type_config.initiative = preParseText(type_config.initiative, tribe);
        parse(type_config.initiative);
    }

    icons.forEach((icon) => {
        assets.push({ [`icon_${icon}`]: `img/icons/${icon}.png` });
    });

    mc.forEach((icon) => {
        assets.push({ [`mc_${icon}`]: `img/icons/mugic/${icon}.png` });
    });

    // console.log(assets);

    return assets;
}

const mc_regex = /({{[0-9x]*}})/g;
/**
 * This is a preparser to deal with how annoying Mugic counters are in text area
 * @param {string} text 
 * @param {string} tribe
 * @return {string} the post processed text
 */
function preParseText (text, tribe) {
    if (mc_regex.test(text)) {
        text = text.replaceAll(mc_regex, (amount) => {
            amount = amount.replace("{{", "").replace("}}", "").toLowerCase();
            if (amount == "x") {
                return `{{${tribe}_x}}`;
            }
            else if (amount == '0') {
                return `{{${tribe}_0}}`;
            }
            else {
                if (amount.trim() == "" || isNaN(amount)) {
                    return `{{${tribe}}}`;
                }
                else if (tribe == "m'arrillian" && (amount == 6 || amount == 10)) {
                    return `{{${tribe}_${amount}}}`;
                } 
                else {
                    return `{{${tribe}}}`.repeat(amount);
                }
            }
        });
    }

    return text;
}
