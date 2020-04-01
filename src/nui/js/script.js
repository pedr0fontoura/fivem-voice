/* eslint-disable @typescript-eslint/explicit-function-return-type */
let IsRadioOn = false;
let RadioHudStyle = 'normal';

function PlaySound(soundTag = null, file = null, args = null) {
    const sound = document.querySelector(`#${soundTag}`);
    const soundFile = file;

    var args = args;

    for (i = 0; i < sound.attributes.length; i++) {
        if (sound.attributes[i].name != 'id') {
            sound.removeAttribute(sound.attributes[i].name);
        }
    }

    if (soundFile == null) {
        sound.setAttribute('src', '');
    } else {
        if (args == null) {
        } else {
            for (const key in args) {
                if (key != 'addMultiListener') {
                    if (key == 'volume') {
                        sound.volume = args[key];
                    } else {
                        sound.setAttribute(key, args[key]);
                    }
                }
            }
        }

        sound.setAttribute('src', soundFile);
        sound.play();
    }
}

function SetHUDVisibility(visible) {
    if (visible) {
        $('body').css('visibility', 'visible');
    } else {
        $('body').css('visibility', 'hidden');
    }
}

function SetRadioHUDStyle(style) {
    if (style === 'minimal') {
        RadioHudStyle = 'minimal';
    } else if (style === 'normal') {
        RadioHudStyle = 'normal';
    } else if (style === 'hidden') {
        RadioHudStyle = 'hidden';
    }
}

function SetRadioPowerState(enabled) {
    if (enabled) {
        IsRadioOn = true;

        $('#radio').css('visibility', 'visible');
    } else {
        IsRadioOn = false;

        $('#radio').css('visibility', 'hidden');
    }

    PlaySound('local', enabled ? 'sounds/radioon.ogg' : 'sounds/radiooff.ogg', { volume: 0.5 });
}

function SetRadioTransmissionState(transmitting) {
    if (transmitting) {
        $('#radio').removeClass();
        $('#radio').addClass('radio-transmitting');
    } else {
        $('#radio').removeClass();
        $('#radio').addClass('radio-idle');
    }

    PlaySound('local', transmitting ? 'sounds/mic_click_on.ogg' : 'sounds/mic_click_off.ogg', { volume: 0.5 });
}

function PlayRemoteClick(status) {
    PlaySound('remote', status ? 'sounds/mic_click_on.ogg' : 'sounds/mic_click_off.ogg', { volume: 0.5 });
}

function ChangeRadioFrequency(frequency) {
    if (frequency !== null) {
        $('.radio-frequency').text(`${frequency} Mhz`);
    }
}

function SetVoiceStatus(speaking) {
    if (speaking) {
        $('#voice').css('animation', 'pulse 1s infinite');
    } else {
        $('#voice').css('animation', '');
    }
}

function ChangeVoiceProximity(proximity) {
    $('#voice').removeClass();

    if (proximity === 'Normal') {
        $('#voice').addClass('range-normal');
    } else if (proximity === 'Shout') {
        $('#voice').addClass('range-shout');
    } else if (proximity === 'Whisper') {
        $('#voice').addClass('range-whisper');
    }
}

window.addEventListener('message', event => {
    if (event.data.type === 'hud') {
        SetHUDVisibility(event.data.enabled);
    } else if (event.data.type === 'proximity') {
        ChangeVoiceProximity(event.data.proximity);
    } else if (event.data.type === 'voiceStatus') {
        SetVoiceStatus(event.data.speaking);
    } else if (event.data.type === 'frequency') {
        ChangeRadioFrequency(event.data.frequency);
    } else if (event.data.type === 'radioPowerState') {
        SetRadioPowerState(event.data.state);
    } else if (event.data.type === 'radioTransmission') {
        SetRadioTransmissionState(event.data.status);
    } else if (event.data.type === 'remoteClick') {
        PlayRemoteClick(event.data.state);
    }
});
