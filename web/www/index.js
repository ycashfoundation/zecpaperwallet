global.jQuery = require('jquery');
require('bootstrap');
var QRCode = require('qrcode')

import * as wasm from "yecpaperwallet";

var address_number = 0;
function add_section(wallet_item) {
    let htmls = `
        <div class="row address-section">
            <div class="col-sm-9" style="word-break: break-word;">
                <h1> Address 
                ${(() => {
                    if (wallet_item["address"].startsWith("y")) { return "(Sapling)"; }
                    else { return "(Transparent)"; }
                   }) ()
                }
                </h1>
                <p class="fixed-width"> ${wallet_item["address"]} </p>
            </div>
            <div class="col-sm-3">
                <canvas id="qrcode_addr_${address_number}"></canvas>
            </div>
        </div>
    `;
    jQuery("#wallet").append(htmls);
    QRCode.toCanvas(document.getElementById("qrcode_addr_"+address_number), 
        wallet_item["address"], {
            scale : 5.5
        });


    let pk_section = `
        <div class="row pk-section">
            <div class="h-dashed"></div>
            <div class="col-sm-3">
                <canvas id="qrcode_pk_${address_number}"></canvas>
            </div>
            <div class="col-sm-9" style="word-break: break-word;">
                <h1> Private Key </h1>
                <p class="fixed-width"> ${wallet_item["private_key"]} </p>
                <br/>
                <h2> Address </h2>
                <p class="fixed-width"> ${wallet_item["address"]} </p>
                ${(() => {
                        if (wallet_item.seed) {
                            return `<code> HD Key: ${wallet_item["seed"]["HDSeed"]}, path: ${wallet_item["seed"]["path"]} </code>`;
                        } else { return ""; }
                   }) ()
                }
            </div>
        </div>
        <div class='h-divider'></div>
    `;
    
    jQuery("#wallet").append(pk_section);
    QRCode.toCanvas(document.getElementById("qrcode_pk_"+address_number), 
        wallet_item["private_key"], {
            scale: wallet_item["private_key"].length < 60 ? 6.5 : 3.5
        });

    address_number++;

    if (address_number % 2 == 0) {
        jQuery("#wallet").append("<div class='page-break'></div>");
    }
}

var user_entropy = "";

function update_user_entropy() {
    let valeur = (user_entropy.length / 2) / 32 * 100; // hex is 2 chars per byte
    if (valeur > 100) {
        valeur = 100;
        if (jQuery("#generate_button").hasClass("btn-warning")) {
            jQuery("#generate_button").removeClass("btn-warning");
            jQuery("#generate_button").addClass("btn-success");
        }
        if (!jQuery("#entropy_bar").hasClass("progress-bar-success")) {
            jQuery("#entropy_bar").addClass("progress-bar-success");
        }
    }

    jQuery('#entropy_bar').css('width', valeur+'%').attr('aria-valuenow', valeur); 
}

// Mouse move for entropy collection
var mouse_count = 0;
jQuery("body").mousemove(function(e) {
    if (mouse_count++ % 5 > 0) return;

    user_entropy += ((e.originalEvent.clientX + e.originalEvent.clientY) % 16).toString(16);
    update_user_entropy();
});

jQuery("#keyboard_entropy").keypress(function (e) {
    user_entropy += (e.originalEvent.charCode % 32).toString(16);
    update_user_entropy();
});

jQuery("#generate_button").click(function (e) {
    jQuery("#configdialog").modal('hide');
});

jQuery("#reset_button").click(function (e) {
    user_entropy = "";
    update_user_entropy();

    address_number = 0;

    jQuery("#generate_button").removeClass("btn-success");
    jQuery("#generate_button").addClass("btn-warning");
    jQuery("#entropy_bar").removeClass("progress-bar-success");

    jQuery("#wallet").empty();
    jQuery("#configdialog").modal('show');
});

jQuery("#print_button").click(function (e) {
    window.print();
});

// First trigger the modal
jQuery("#configdialog").modal({
    keyboard: false
});

const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');


jQuery("#configdialog").on("hidden.bs.modal", function (e) {        
    // Get system entropy
    var buf = new Uint8Array(32);
    window.crypto.getRandomValues(buf);
    let system_entropy = toHexString(buf);

    let numzAddresses = jQuery("#numzAddresses").val();
    let numtAddresses = jQuery("#numtAddresses").val();

    jQuery("#pleasewait").modal('show');

    // Run this async so that the please wait dialog can show
    setTimeout(() => {
        let w = JSON.parse(wasm.get_wallet(numzAddresses, numtAddresses, user_entropy + system_entropy));
    
        w.forEach(wallet_item => {
            add_section(wallet_item); 
        });    
        jQuery("#pleasewait").modal("hide");
    }, 1);
    
});
