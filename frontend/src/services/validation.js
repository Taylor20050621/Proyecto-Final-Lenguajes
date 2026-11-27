const MAX_PROTOTYPE_SIZE = 4 * 1024 * 1024 * 1024
const MAX_COVER_SIZE = 10 * 1024 * 1024
const PROTOTYPE_EXTENSIONS = new Set(['exe', 'zip', 'rar', '7z', 'apk', 'pdf'])
const COVER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function getExtension(file) {
  return file?.name?.split('.').pop()?.toLowerCase() || ''
}

export function validatePrototypeFile(file) {
  if (!file) return 'Selecciona el archivo del prototipo.'
  if (file.size === 0 || file.size > MAX_PROTOTYPE_SIZE) {
    return 'El archivo es demasiado pesado (supera el límite de 4 GB) o está vacío.'
  }
  if (!PROTOTYPE_EXTENSIONS.has(getExtension(file))) {
    return 'Formato no permitido. Solo se aceptan archivos .exe, .zip, .rar, .7z, .apk o .pdf.'
  }
  return ''
}

export function validateCoverFile(file) {
  if (!file) return ''
  if (file.size === 0) return 'La imagen de portada está vacía o dañada.'
  if (file.size > MAX_COVER_SIZE) return 'La portada no puede superar los 10 MB.'
  if (!COVER_EXTENSIONS.has(getExtension(file))) {
    return 'Formato de portada no válido. Solo se aceptan archivos .jpg, .jpeg, .png o .webp.'
  }
  return ''
}

export function isValidVersion(version) {
  return /^v?\d+(?:\.\d+){1,2}$/i.test(version.trim())
}

export function validateOfficialUrl(value) {
  if (!value.trim()) return ''
  if (!/^https?:\/\//i.test(value.trim())) {
    return 'Ingresa un enlace válido que comience con http:// o https://.'
  }
  try {
    const url = new URL(value.trim())
    if (!url.hostname || !['http:', 'https:'].includes(url.protocol)) {
      return 'Ingresa un enlace válido que comience con http:// o https://.'
    }
  } catch {
    return 'Ingresa un enlace válido que comience con http:// o https://.'
  }
  if (value.trim().length > 500) return 'El enlace no puede superar los 500 caracteres.'
  return ''
}
