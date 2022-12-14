class Main
{
    constructor()
    {
        this.initMenu()
        this.initSections()
        this.initSectionWord()
        this.initSectionRepeat()
        this.initSectionImport()
        this.initModalActions()
        this.initMainEvents()
        this.words = []
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
                        this.startRepeat()
                    break
                }
                menuTrigger.classList.remove('is-active')
                menu.classList.remove('is-active')
            })
        })
    }
    initSectionWord()
    {
        const form = document.querySelector('.js-form-word')
        const word = form.querySelector('input[name="word"]')
        const translate = form.querySelector('input[name="translate"]')
        const submit = form.querySelector('button[type="submit"]')
        const cancel = form.querySelector('button[type="button"]')

        const reset = (event) => {
            word.value = ''
            translate.value = ''
            submit.disabled = true
        }
        const toggleSubmit = (event) => {
            if (word.value.length > 0 && translate.value.length > 0) submit.disabled = false
            else submit.disabled = true
        }
        const submitMethod = async (event) => {
            event.preventDefault()
            const res = await window.electron.invoke('save-word', {
                word: word.value.trim().toLowerCase(),
                translate: translate.value.trim().toLowerCase()
            })
            reset()
            if (res) this.openModal('success', 'Success', `The word was successfully saved. Now it's available to repeat`)
            else this.openModal('error', 'Error', 'This word is already in the dictionary')
        }

        word.addEventListener('keyup', toggleSubmit)
        translate.addEventListener('keyup', toggleSubmit)
        cancel.addEventListener('click', reset)
        form.addEventListener('submit', submitMethod)
        reset()
    }
    initSectionRepeat()
    {
        const form = document.querySelector('.js-form-repeat')
        const word = document.querySelector('.js-word')
        const translateWord = document.querySelector('.js-translate')
        const translate = form.querySelector('input[name="translate"]')
        const id = form.querySelector('input[name="id"]')
        const submit = form.querySelector('button[type="submit"]')
        const layout = document.querySelector('.js-layout')

        const reset = () => {
            word.innerHTML = ''
            translateWord.innerHTML = ''
            translate.value = ''
            id.value = '0'
            layout.classList.remove('is-danger', 'is-success')
            layout.classList.add('is-info')
            submit.disabled = true
        }
        const toggleSubmit = (event) => {
            if (translate.value.length > 0) submit.disabled = false
            else submit.disabled = true
        }
        const submitMethod = async (event) => {
            event.preventDefault()
            const res = await window.electron.invoke('check-word', {
                translate: translate.value.trim().toLowerCase(),
                id: parseInt(id.value)
            })
            layout.classList.remove('is-info')
            layout.classList.add(res ? 'is-success' : 'is-danger')
            translateWord.innerHTML = this.words[0].translate
            this.words = this.words.slice(1)
            submit.disabled = true
            setTimeout(() => {
                reset()
                this.nextWord()
            }, 5000)
        }
        translate.addEventListener('keyup', toggleSubmit)
        form.addEventListener('submit', submitMethod)

        reset()
    }
    nextWord()
    {
        const current = this.words[0]
        if (!current) {
            this.openModal('success', `That's all`, 'The words to repeat are over')
            const wordSection = document.querySelector('.js-section-selector[data-section="word"]')
            wordSection.click()
            return
        }
        const form = document.querySelector('.js-form-repeat')
        const word = document.querySelector('.js-word')
        const id = form.querySelector('input[name="id"]')
        word.innerHTML = current.word
        id.value = current.id
    }
    async startRepeat()
    {
        const menuWarning = document.querySelector('.js-menu-warning')
        const sectionRepeat = document.querySelector('.js-section-selector[data-section="repeat"]')
        const words = await window.electron.invoke('get-words')
        menuWarning.classList.add('is-hidden')
        sectionRepeat.classList.remove('has-text-warning', 'has-text-weight-bold')
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
    initModalActions()
    {
        const modal = document.querySelector('.js-modal')
        const background = modal.querySelector('.modal-background')
        const closeButton = modal.querySelector('button')
        const head = modal.querySelector('.modal-card-head')
        const modalTitle = modal.querySelector('.modal-card-title')
        const modalBody = modal.querySelector('.modal-card-body')
        const close = (event) => {
            modal.classList.remove('is-active')
            head.classList.remove('has-background-success', 'has-background-danger')
            modalTitle.innerHTML = ''
            modalBody.innerHTML = ''
        }
        background.addEventListener('click', close)
        closeButton.addEventListener('click', close)
    }
    openModal(type, title, body)
    {
        const modal = document.querySelector('.js-modal')
        const background = modal.querySelector('.modal-background')
        const closeButton = modal.querySelector('button')
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
            sectionRepeat.classList.add('has-text-warning', 'has-text-weight-bold')
        })
    }
}

window.addEventListener('load', () => {
    new Main()
})
