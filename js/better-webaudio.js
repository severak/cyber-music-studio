// WIP this is prototype of how we should make WebAudio better0

AudioParam.prototype.setNow = function (value) {
    // TODO implement
}

AudioParam.prototype.moveToNow = function (target, time) {
    // TODO implement
}

class ADSRNode extends ConstantSourceNode
{
    constructor(context,attack = 0.01, decay = 0.5, sustain = 0, release = 0.01, max = 1) {
        super(context, {offset: 0});
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
    }

    triggerAttack(startAt)
    {
        // TODO - implement - see hb.adsrStart (by moving this.offset)
    }

    triggerRelease(startAt)
    {
        // TODO - implement - see hb.adsrStop
    }
}

class WhiteNoiseSourceNode extends AudioBufferSourceNode
{
    constructor(context) {
        super(context); // TODO - zde vygenerovat noise a sputit to
    }
}

class BetterAudioContext extends AudioContext
{
    createADSRNode()
    {
        return new ADSRNode(this);
    }
}
