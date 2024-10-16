class Main
{
    constructor()
    {
        this.initMenu()
        this.initSections()
        this.initSectionWord()
        this.initSectionRepeat()
        this.initSectionImport()
        this.initSectionSettings()
        this.initSectionGrammar()
        this.initModalActions()
        this.initMainEvents()
        this.words = []
        this.isStartRepeat = false
    }
    initMenu()
    {
        const menuTrigger = document.querySelector('.js-menu-trigger')
        const menu = document.querySelector('.js-menu')
        menuTrigger.addEventListener('click', () => {
            menuTrigger.classList.toggle('is-active')
            menu.classList.toggle('is-active')
        })
    }
    initSections()
    {
        const selector = document.querySelectorAll('.js-section-selector')
        const sections = document.querySelectorAll('.js-section')
        const menuTrigger = document.querySelector('.js-menu-trigger')
        const menu = document.querySelector('.js-menu')
        selector.forEach(sel => {
            sel.addEventListener('click', event => {
                event.preventDefault()
                const name = sel.dataset.section
                const section = document.querySelector(`.js-section-${name}`)
                sections.forEach(s => s.classList.add('is-hidden'))
                section.classList.remove('is-hidden')
                selector.forEach(sel => sel.classList.remove('is-active'))
                sel.classList.add('is-active')
                switch (name) {
                    case 'repeat':
                        if (!this.isStartRepeat) {
                            this.startRepeat()
                        }
                        const translate = document.querySelector('.js-form-repeat input[name="translate"]')
                        if (translate) {
                            translate.focus()
                        }
                    break
                }
                menuTrigger.classList.remove('is-active')
                menu.classList.remove('is-active')
            })
        })
    }
    initSectionWord(init = null)
    {
        const form = document.querySelector('.js-form-word')
        const title = document.querySelector('.js-section-word-title')
        const word = form.querySelector('input[name="word"]')
        const id = form.querySelector('input[name="id"]')
        const translate = form.querySelector('input[name="translate"]')
        const part = form.querySelector('select[name="part"]')
        const submit = form.querySelector('button[type="submit"]')
        const cancel = form.querySelector('button[type="button"]')
        const sectionRepeat = document.querySelector('.js-section-selector[data-section="repeat"]')

        const fill = () => {
            word.value = (init && init.word ? init.word : '')
            translate.value = (init && init.translate ? init.translate : '')
            part.value = (init && init.part ? init.part : '')
            submit.disabled = (init ? false : true)
        }
        const reset = () => {
            let isEdit = (id.value !== '0')
            word.value = ''
            translate.value = ''
            part.value = ''
            submit.disabled = true
            id.value = '0'
            title.textContent = 'Add new word'
            if (isEdit) {
                sectionRepeat.click()
                this.words = this.words.slice(1)
                this.nextWord()
            }
        }
        const toggleSubmit = () => {
            if (word.value.length > 0 && translate.value.length > 0) submit.disabled = false
            else submit.disabled = true
        }
        const submitMethod = async (event) => {
            event.preventDefault()
            const res = await window.electron.invoke('save-word', {
                word: word.value.trim().toLowerCase(),
                translate: translate.value.trim().toLowerCase(),
                part: (part.value ? part.value: null),
                id: parseInt(id.value)
            })
            reset()
            if (res) this.openModal('success', 'Success', `The word was successfully saved. Now it's available to repeat`)
            else this.openModal('error', 'Error', 'This word is already in the dictionary')
        }
        if (!init) {
            word.addEventListener('keyup', toggleSubmit)
            translate.addEventListener('keyup', toggleSubmit)
            cancel.addEventListener('click', reset)
            form.addEventListener('submit', submitMethod)
            reset()
        } else {
            fill()
        }
    }
    initSectionRepeat()
    {
        const form = document.querySelector('.js-form-repeat')
        const word = document.querySelector('.js-word')
        const translateWord = document.querySelector('.js-translate')
        const translate = form.querySelector('input[name="translate"]')
        const id = form.querySelector('input[name="id"]')
        const submit = form.querySelector('button[type="submit"]')
        const skipEl = form.querySelector('.js-word-skip')
        const layout = document.querySelector('.js-layout')

        let interval = null

        const reset = () => {
            word.innerHTML = ''
            translateWord.innerHTML = ''
            translate.value = ''
            id.value = '0'
            layout.classList.remove('is-danger', 'is-success', 'is-warning')
            layout.classList.add('is-info')
            submit.disabled = true
            skipEl.disabled = false
            translate.disabled = false
        }
        const toggleSubmit = () => {
            if (translate.value.length > 0) submit.disabled = false
            else submit.disabled = true
        }
        const checkWord = async (event, type) => {
            event.preventDefault()
            if (!this.isStartRepeat) {
                this.isStartRepeat = true
                window.electron.invoke('start-repeat')
            }
            if (type === 'skip') {
                layout.classList.remove('is-info')
                layout.classList.add('is-warning')
            } else {
                const res = await window.electron.invoke('check-word', {
                    translate: translate.value.trim().toLowerCase(),
                    id: parseInt(id.value)
                })
                layout.classList.remove('is-info')
                layout.classList.add(res ? 'is-success' : 'is-danger')
            }
            translateWord.innerHTML = this.words[0].translate + '<button class="button ml-2 is-small is-link js-word-edit" type="button">Edit <b class="ml-1"></b></button>'
            submit.disabled = true
            skipEl.disabled = true
            translate.disabled = true

            const editEl = translateWord.querySelector('.js-word-edit')
            const editElTimer = editEl.querySelector('b')
            editEl.addEventListener('click', edit)
            let s = 5
            if (type === 'skip') {
                s = 10
            }
            editElTimer.textContent = s
            interval = setInterval(() => {
                s--
                editElTimer.textContent = s
                if (s <= 0) {
                    clearInterval(interval)
                    this.words = this.words.slice(1)
                    reset()
                    this.nextWord()
                    translate.focus()
                }
            }, 1000)
        }
        const edit = () => {
            clearInterval(interval)
            const wordNav = document.querySelector('.js-section-selector[data-section="word"]')
            const wordSection = document.querySelector('.js-section-word')
            const title = wordSection.querySelector('.js-section-word-title')
            const id = wordSection.querySelector('form input[name="id"]')
            title.innerText = 'Edit word'
            id.value = this.words[0].id
            reset()
            this.initSectionWord(this.words[0])
            wordNav.click()
        }

        translate.addEventListener('keyup', toggleSubmit)
        form.addEventListener('submit', (event) => checkWord(event, 'submit'))
        skipEl.addEventListener('click', (event) => checkWord(event, 'skip'))

        reset()
    }
    nextWord()
    {
        const current = this.words[0]
        if (!current) {
            this.isStartRepeat = false
            this.openModal('success', `That's all`, 'The words to repeat are over')
            const wordSection = document.querySelector('.js-section-selector[data-section="word"]')
            const menuWarning = document.querySelector('.js-menu-warning')
            const sectionRepeat = document.querySelector('.js-section-selector[data-section="repeat"]')
            wordSection.click()
            menuWarning.classList.add('is-hidden')
            sectionRepeat.classList.remove('has-text-warning', 'has-text-weight-bold')
            window.electron.invoke('end-repeat')
            return
        }
        const form = document.querySelector('.js-form-repeat')
        const word = document.querySelector('.js-word')
        const wordsCount = document.querySelector('.js-words-count')
        const id = form.querySelector('input[name="id"]')
        word.innerHTML = current.word + (current.part ? ' <span class="tag is-link">' + current.part + '</span>' : '')
        wordsCount.innerHTML = this.words.length
        id.value = current.id
    }
    async startRepeat()
    {
        const words = await window.electron.invoke('get-words')
        this.words = words
        this.nextWord()
    }
    initSectionImport()
    {
        const form = document.querySelector('.js-form-import')
        const submit = form.querySelector('button[type="submit"]')
        const file = form.querySelector('input[name="import"]')
        const fileName = form.querySelector('.file-name')
        const exportButton = document.querySelector('.js-export-file')

        const reset = () => {
            fileName.innerHTML = ''
            fileName.classList.add('is-hidden')
            file.value = ''
            submit.disabled = true
        }

        file.addEventListener('change', event => {
            const file = event.target.files[0]
            const name = file.name
            fileName.innerHTML = name
            fileName.classList.remove('is-hidden')
            submit.disabled = false
        })
        form.addEventListener('submit', async event => {
            event.preventDefault()
            const formData = new FormData(event.target)
            const path = formData.get('import').path
            submit.disabled = true
            try {
                const rows = await window.electron.invoke('import-dump', {
                    path
                })
                if (rows === 0) {
                    this.openModal('error', 'Import data', `No words have been added`)
                } else {
                    this.openModal('success', 'Import data', `${rows} word${rows > 1 ? 's' : ''} have been added`)
                }
            } catch (e) {
                this.openModal('error', 'Import data', `Wrong file format`)
            } finally {
                reset()
            }
        })
        exportButton.addEventListener('click', event => {
            window.electron.invoke('export-dump')
        })
    }
    async initSectionSettings()
    {
        const settings = await window.electron.invoke('get-settings')
        const section = document.querySelector('.js-section-settings')
        const frequency = section.querySelectorAll('input[name="frequency"]')
        frequency.forEach(item => {
            if (item.value === settings.frequency) {
                item.checked = true
            }
            item.addEventListener('change', async (event) => {
                let value = event.target.value
                await window.electron.invoke('set-settings', {
                    key: 'frequency',
                    value: value
                })
            })
        })
    }
    initSectionGrammar()
    {
        const links = document.querySelectorAll('.js-grammar-link')
        const contents = document.querySelectorAll('.js-grammar-content')

        const showSection = (className, contents) => {
            contents.forEach(item => item.classList.add('is-hidden'))
            const section = document.querySelector(className)
            if (section) section.classList.remove('is-hidden')
            return section
        }
        const tagClick = (event, links) => {
            const target = event.target
            links.forEach(item => item.classList.add('is-light'))
            target.classList.remove('is-light')
            const value = target.dataset.value
            return value
        }
        const createTable = ({ columns = 1, head = null, rows = [], type = 'free' } = {}) => {
            let table = '<div class="columns">'
            for (let i = 0; i < columns; i++) {
                let content = '<table class="table">'
                if (head && head[i]) {
                    content += '<thead><tr>'
                    head[i].forEach(el => content += `<th>${el}</th>`)
                    content += '</tr></thead>'
                }
                if (rows[i]) {
                    if (type === 'verb') {
                        rows[i].forEach((el, j) => content += `<tr><td>${DICT.pronouns.all[j]}</td><td>${el}</td></tr>`)
                    } else {
                        rows[i].forEach(row => {
                            content += '<tr>'
                            row.forEach(el => content += `<td>${el}</td>`)
                            content += '</tr>'
                        })
                    }
                }
                content += '</table>'
                table += `<div class="column">${content}</div>`
            }
            table += '</div>'
            return table
        }
        const auxiliaryVerbsActions = (container) => {
            const links = document.querySelectorAll('.js-grammar-link-auxiliary_verbs-time')
            const linkClick = (event) => {
                const value = tagClick(event, links)
                container.innerHTML = createTable({
                    columns: 3,
                    head: [
                        DICT.auxiliaryVerbs.be.head,
                        DICT.auxiliaryVerbs.do.head,
                        DICT.auxiliaryVerbs.have.head
                    ],
                    rows: [
                        DICT.auxiliaryVerbs.be[value].map(el => el.toLowerCase()),
                        DICT.auxiliaryVerbs.do[value].map(el => el.toLowerCase()),
                        DICT.auxiliaryVerbs.have[value].map(el => el.toLowerCase())
                    ],
                    type: 'verb'
                })
            }
            links.forEach(item => item.addEventListener('click', linkClick))
            links[1].click()
        }
        const tensesActions = (container) => {
            const times = document.querySelectorAll('.js-grammar-link-tenses-time')
            const tenses = document.querySelectorAll('.js-grammar-link-tenses-tense')
            const forms = document.querySelectorAll('.js-grammar-link-tenses-form')
            const description = document.querySelector('.js-grammar-content-form')
            let time = ''
            let tense = ''
            let form = ''
            let positive = []
            let negative = []
            let question = []
            const linkClick = (event, links) => {
                const classes = event.target.classList
                const value = tagClick(event, links)
                if (classes.contains('js-grammar-link-tenses-time')) time = value
                if (classes.contains('js-grammar-link-tenses-tense')) tense = value
                if (classes.contains('js-grammar-link-tenses-form')) form = value
                if (time.length === 0 || tense.length === 0 || form.length === 0) return

                const word = DICT.tenses.regular
                let content = ''
                let rows = []
                switch (`${time} ${tense}`) {
                    case 'present simple':
                        content = 'Constant, regular actions or facts of life.<br>I, We, They, You <strong>infinitive</strong><br>He, She, It <strong>infinitive + s (es)</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, word + (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 's' : ''), '']
                            else if (form === 'negative') return [pronoun, (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? `doesn't (does not)` : `don't (do not)`), word]
                            else if (form === 'question') return [(DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 'Does' : 'Do'), pronoun, word + '?']
                        })
                    break
                    case 'past simple':
                        content = 'One action in the past.<br>Regular: <strong>infinitive + ed</strong><br>Irregular: <strong>II form</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, word + 'ed', '']
                            else if (form === 'negative') return [pronoun, `didn't (did not)`, word]
                            else if (form === 'question') return ['Did', pronoun, word + '?']
                        })
                    break
                    case 'future simple':
                        content = 'One action in the future.<br>Will + <strong>infinitive</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, `will (${pronoun}'ll)`, word]
                            else if (form === 'negative') return [pronoun, `won't (will not)`, word]
                            else if (form === 'question') return ['Will', pronoun, word + '?']
                        })
                    break
                    case 'present continuous':
                        content = 'Now an action is taking place.<br>I <strong>am + infinitive + ing</strong><br>He, She, It <strong>is + infinitive + ing</strong><br>We, They, You <strong>are + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, DICT.auxiliaryVerbs.be.present[i].toLowerCase(), word + 'ing']
                            else if (form === 'negative') return [pronoun, DICT.auxiliaryVerbs.be.present[i].toLowerCase() + ' not', word + 'ing']
                            else if (form === 'question') return [DICT.auxiliaryVerbs.be.present[i], pronoun, word + 'ing?']
                        })
                    break
                    case 'past continuous':
                        content = 'At some point in the past an action is taking place.<br>I, He, She, It <strong>was + infinitive + ing</strong><br>We, They, You <strong>were + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, DICT.auxiliaryVerbs.be.past[i].toLowerCase(), word + 'ing']
                            else if (form === 'negative') return [pronoun, DICT.auxiliaryVerbs.be.past[i].toLowerCase() + ' not', word + 'ing']
                            else if (form === 'question') return [DICT.auxiliaryVerbs.be.past[i], pronoun, word + 'ing?']
                        })
                    break
                    case 'future continuous':
                        content = 'At some point in the future an action is taking place.<br><strong>Will + be + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, DICT.auxiliaryVerbs.be.future[i].toLowerCase(), word + 'ing']
                            else if (form === 'negative') return [pronoun, `won't (will not) be`, word + 'ing']
                            else if (form === 'question') return ['Will', pronoun + ' be', word + 'ing?']
                        })
                    break
                    case 'present perfect':
                        content = 'To the present moment is the result of some action.<br>Regular: I, We, They, You <strong>have + infinitive + ed</strong>. He, She, It <strong>has + infinitive + ed</strong><br>Irregular: I, We, They, You <strong>have + III form</strong>. He, She, It <strong>has + III form</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 'has' : 'have'), word + 'ed']
                            else if (form === 'negative') return [pronoun, (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? `hasn't (has not)` : `haven't (have not)`), word + 'ed']
                            else if (form === 'question') return [(DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 'Has' : 'Have'), pronoun, word + 'ed?']
                        })
                    break
                    case 'past perfect':
                        content = 'To the moment in the past is the result of some action.<br>Regular: <strong>had + infinitive + ed</strong><br>Irregular: <strong>had + III form</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, 'had', word + 'ed']
                            else if (form === 'negative') return [pronoun, `hadn't (had not)`, word + 'ed']
                            else if (form === 'question') return ['Had', pronoun, word + 'ed?']
                        })
                    break
                    case 'future perfect':
                        content = 'To the moment in the future is the result of some action.<br>Regular: <strong>will + have + infinitive + ed</strong><br>Irregular: <strong>will + have + III form</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, 'will have', word + 'ed']
                            else if (form === 'negative') return [pronoun, `won't (will not) have`, word + 'ed']
                            else if (form === 'question') return ['Will', pronoun + ' have', word + 'ed?']
                        })
                    break
                    case 'present perfectContinuous':
                        content = 'To date, the action has already taken place or will take place.<br>I, We, They, You <strong>have + been + infinitive + ing</strong><br>He, She, It <strong>has + been + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 'has' : 'have') + ' been', word + 'ing']
                            else if (form === 'negative') return [pronoun, (DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? `hasn't (has not)` : `haven't (have not)`) + ' been', word + 'ing']
                            else if (form === 'question') return [(DICT.pronouns.third.singular.indexOf(pronoun) !== -1 ? 'Has' : 'Have'), pronoun + ' been', word + 'ing?']
                        })
                    break
                    case 'past perfectContinuous':
                        content = 'By the time in the past, the action has already happened or will happen.<br><strong>Had + been + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, 'had been', word + 'ing']
                            else if (form === 'negative') return [pronoun, `hadn't (had not) been`, word + 'ing']
                            else if (form === 'question') return ['Had', pronoun + ' been', word + 'ing?']
                        })
                    break
                    case 'future perfectContinuous':
                        content = 'At a point in the future, the action has already taken place or will take place.<br><strong>Will + have + been + infinitive + ing</strong>'
                        rows = DICT.pronouns.all.map((pronoun, i) => {
                            if (form === 'positive') return [pronoun, `will (${pronoun}'ll) have been`, word + 'ing']
                            else if (form === 'negative') return [pronoun, `won't (will not) have been`, word + 'ing']
                            else if (form === 'question') return ['Will', pronoun + ' have been', word + 'ing?']
                        })
                    break
                }
                description.innerHTML = content
                container.innerHTML = createTable({
                    rows: [
                        rows
                    ]
                })
            }
            times.forEach(item => item.addEventListener('click', event => linkClick(event, times)))
            tenses.forEach(item => item.addEventListener('click', event => linkClick(event, tenses)))
            forms.forEach(item => item.addEventListener('click', event => linkClick(event, forms)))
            times[1].click()
            tenses[0].click()
            forms[0].click()
        }
        const linkClick = (event) => {
            const value = tagClick(event, links)
            const section = showSection(`.js-grammar-content-${value}`, contents)
            const container = section.querySelector('.js-grammar-content-container')
            switch (value) {
                case 'auxiliary_verbs':
                    auxiliaryVerbsActions(container)
                break
                case 'irregular_verbs':
                    container.innerHTML = createTable({
                        head: [
                            DICT.irregularVerbs.head
                        ],
                        rows: [
                            DICT.irregularVerbs.verbs
                        ]
                    })
                break
                case 'tenses':
                    tensesActions(container)
                break
            }
        }
        links.forEach(item => item.addEventListener('click', linkClick))
    }
    initModalActions()
    {
        const modal = document.querySelector('.js-modal')
        const background = modal.querySelector('.modal-background')
        const closeButton = modal.querySelector('button')
        const head = modal.querySelector('.modal-card-head')
        const modalTitle = modal.querySelector('.modal-card-title')
        const modalBody = modal.querySelector('.modal-card-body')
        const close = () => {
            modal.classList.remove('is-active')
            head.classList.remove('has-background-success', 'has-background-danger')
            modalTitle.innerHTML = ''
            modalBody.innerHTML = ''
        }
        background.addEventListener('click', close)
        closeButton.addEventListener('click', close)
        document.addEventListener('keyup', event => {
            if (event.key === 'Escape') {
                close()
            }
        })
    }
    openModal(type, title, body)
    {
        const modal = document.querySelector('.js-modal')
        const head = modal.querySelector('.modal-card-head')
        const modalTitle = modal.querySelector('.modal-card-title')
        const modalBody = modal.querySelector('.modal-card-body')
        modalTitle.innerHTML = title
        modalBody.innerHTML = body
        switch (type) {
            case 'success':
                head.classList.add('has-background-success')
            break
            case 'error':
                head.classList.add('has-background-danger')
            break
        }
        modal.classList.add('is-active')
    }
    initMainEvents()
    {
        const menuWarning = document.querySelector('.js-menu-warning')
        const sectionRepeat = document.querySelector('.js-section-selector[data-section="repeat"]')
        window.electron.on('time-to-repeat', event => {
            menuWarning.classList.remove('is-hidden')
            sectionRepeat.classList.add('has-text-black', 'has-text-weight-bold')
        })
        window.electron.on('open-repeat-section', event => {
            sectionRepeat.click()
        })
    }
}

window.addEventListener('load', () => {
    new Main()
})
