import { mount } from 'svelte'
import Popup from './Popup.svelte'

const host = document.getElementById('popup')!
mount(Popup, { target: host })
