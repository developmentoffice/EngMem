const DICT = {
    pronouns: {
        all: ['I', 'He', 'She', 'It', 'We', 'They', 'You'],
        first: {
            singular: ['I'],
            plural: ['We']
        },
        second: {
            singular: ['You'],
            plural: ['You']
        },
        third: {
            singular: ['He', 'She', 'It'],
            plural: ['They']
        }
    },
    auxiliaryVerbs: {
        be: {
            head: ['', '<strong>to be</strong>'],
            present: ['Am', 'Is', 'Is', 'Is', 'Are', 'Are', 'Are'],
            past: ['Was', 'Was', 'Was', 'Was', 'Were', 'Were', 'Were'],
            future: ['Will be', 'Will be', 'Will be', 'Will be', 'Will be', 'Will be', 'Will be']
        },
        do: {
            head: ['', '<strong>to do</strong>'],
            present: ['Do', 'does', 'does', 'does', 'Do', 'Do', 'Do'],
            past: ['Did', 'Did', 'Did', 'Did', 'Did', 'Did', 'Did'],
            future: ['Will do', 'Will do', 'Will do', 'Will do', 'Will do', 'Will do', 'Will do']
        },
        have: {
            head: ['', '<strong>to have</strong>'],
            present: ['Have', 'Has', 'Has', 'Has', 'Have', 'Have', 'Have'],
            past: ['Had', 'Had', 'Had', 'Had', 'Had', 'Had', 'Had'],
            future: ['Will have', 'Will have', 'Will have', 'Will have', 'Will have', 'Will have', 'Will have']
        }
    },
    irregularVerbs: {
        head: [
            'I <span class="icon has-text-info" title="Infinitive"><i class="fas fa-info-circle"></i></span>',
            'II <span class="icon has-text-info" title="Past Simple"><i class="fas fa-info-circle"></i></span>',
            'III <span class="icon has-text-info" title="Past Participle"><i class="fas fa-info-circle"></i></span>'
        ],
        verbs: [
            ['be', 'was/were', 'been'],
            ['become', 'became', 'become'],
            ['begin', 'began', 'begun'],
            ['bring', 'brought', 'brought'],
            ['buy', 'bought', 'bought'],
            ['choose', 'chose', 'chosen'],
            ['come', 'came', 'come'],
            ['do', 'did', 'done'],
            ['drink', 'drank', 'drunk'],
            ['drive', 'drove', 'driven'],
            ['eat', 'ate', 'eaten'],
            ['fall', 'fell', 'fallen'],
            ['feel', 'felt', 'felt'],
            ['find', 'found', 'found'],
            ['fly', 'flew', 'flown'],
            ['forget', 'forgot', 'forgotten'],
            ['get', 'got', 'got'],
            ['give', 'gave', 'given'],
            ['go', 'went', 'gone'],
            ['have', 'had', 'had'],
            ['hear', 'heard', 'heard'],
            ['keep', 'kept', 'kept'],
            ['know', 'knew', 'known'],
            ['leave', 'left', 'left'],
            ['lend', 'lent', 'lent'],
            ['let', 'let', 'let'],
            ['lose', 'lost', 'lost'],
            ['make', 'made', 'made'],
            ['meet', 'met', 'met'],
            ['pay', 'paid', 'paid'],
            ['put', 'put', 'put'],
            ['read', 'read (pron. "red")', 'read (pron. "red")'],
            ['run', 'ran', 'run'],
            ['say', 'said', 'said'],
            ['see', 'saw', 'seen'],
            ['sell', 'sold', 'sold'],
            ['send', 'sent', 'sent'],
            ['sing', 'sang', 'sung'],
            ['sit', 'sat', 'sat'],
            ['sleep', 'slept', 'slept'],
            ['speak', 'spoke', 'spoken'],
            ['stand', 'stood', 'stood'],
            ['swim', 'swam', 'swum'],
            ['take', 'took', 'taken'],
            ['teach', 'taught', 'taught'],
            ['tell', 'told', 'told'],
            ['think', 'thought', 'thought'],
            ['understand', 'understood', 'understood'],
            ['wear', 'wore', 'worn'],
            ['write', 'wrote', 'written']
        ]
    },
    tenses: {
        regular: 'work'
    }
}
