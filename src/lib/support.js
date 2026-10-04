// Company services, equipment requests and shipment tracking, shared by the server and both portals.
import { services } from '../data/portalExtra.js'

// Services an employee can open a request for (EAP is a phone line, the verification letter downloads instantly).
export const SERVICES = Object.fromEntries(services.map((s) => [s.key, { ...s, request: !['eap', 'verify'].includes(s.key) }]))

export const EQUIPMENT_TYPES = ['Something is broken or not working', 'Request new equipment', 'Lost or stolen device (urgent)', 'Change my shipping address']

// The four steps every package goes through, as shown on the tracking page.
export const SHIP_STEPS = ['Label created', 'On the way', 'Out for delivery', 'Delivered']
export const SHIP_SERVICES = ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air', 'Next Day Air Early']

export const REQUEST_STATUSES = ['Open', 'In progress', 'Resolved', 'Declined']
