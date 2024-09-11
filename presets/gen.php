<?php
// generates presets for Groovebox:

class DrGroovePreset
{
    protected $samples = [];

    public function addSample($path, $alias='', $tune=0, $vol=0.5)
    {
        if (!$alias) $alias = basename($path);
        $data = file_get_contents($path);

        $this->samples[] = [
            'name'=>$alias,
            'b64'=>base64_encode($data),
            'tune'=>$tune,
            'vol'=>$vol
        ];

        return $this;
    }

    public function save($file)
    {
        file_put_contents($file, json_encode(['samples'=>$this->samples]));
    }
}

// these paths are not commited but these are trivial to reconstruct if you need them

// lofi MC3a
(new DrGroovePreset())
    ->addSample('../../paleta/mc3a_kick.wav', 'kick')
    ->addSample('../../paleta/mc3a_snare.wav', 'snare')
    ->addSample('../../paleta/mc3_open_hat.wav', 'open hat')
    ->addSample('../../paleta/mc3a_closed_hat.wav', 'closed hat')
    ->addSample('../../paleta/mc3a_bongo.wav', 'bongo')
    ->save('mc3a.json');

// DR660
(new DrGroovePreset())
    ->addSample('../../samples_external/legowelt_dr660/DR660 Bassdrum modest.wav', 'kick')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Snare Yeah.wav', 'snare')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Hihat Real Open.wav', 'open hat')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Hihat Real Closed.wav', 'closed hat')
    ->addSample('../../samples_external/legowelt_dr660/DR660 808 Cowbell.wav', 'cowbell low', -300)
    ->addSample('../../samples_external/legowelt_dr660/DR660 808 Cowbell.wav', 'cowbell', 0)
    ->addSample('../../samples_external/legowelt_dr660/DR660 808 Cowbell.wav', 'cowbell hi', +300)
    ->save('dr660.json');

// DR660 industrial
(new DrGroovePreset())
    ->addSample('../../samples_external/legowelt_dr660/DR660 Bassdrum Industrial.wav', 'kick')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Snare Dark and Big.wav', 'snare')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Anvil.wav', 'anvil')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Industrial Sound.wav', 'hammer')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Cowbell.wav', 'cowbell')
    ->addSample('../../samples_external/legowelt_dr660/DR660 Clap verb.wav', 'clap')
    ->save('dr660industrial.json');

(new DrGroovePreset())
    ->save('empty.json');
