const socket = io()
//elements
const $messageForm = document.querySelector('#message')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messageFormSendLocationButton = document.querySelector('#location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () =>{
        // New message element
        const $newMessage = $messages.lastElementChild

        // Height of the new message
        const newMessageStyles = getComputedStyle($newMessage)
        const newMessageMargin = parseInt(newMessageStyles.marginBottom)
        const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
        // Visible height
        const visibleHeight = $messages.offsetHeight
    
        // Height of messages container
        const containerHeight = $messages.scrollHeight
    
        // How far have I scrolled?
        const scrollOffset = $messages.scrollTop + visibleHeight
    
        if (containerHeight - newMessageHeight <= scrollOffset) {
            $messages.scrollTop = $messages.scrollHeight
        }

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()

})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate,{
        username: message.username,
        url:message.url,
        createdAt: moment(message.createdAt).format('h:mm a')


    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
  e.preventDefault()
  $messageFormButton.setAttribute('disabled', 'disabled')

  let text = e.target.elements.message.value
  socket.emit('sendMessage',text,(error)=>{
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
      if(error){
          return console.log(error)
      }

      console.log('Message delivered')
  })
 })

 $messageFormSendLocationButton.addEventListener('click',()=>{
    $messageFormSendLocationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Geoloaction is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        const latitude  = position.coords.latitude
        const longitude = position.coords.longitude
        socket.emit('sendLocation',{latitude,longitude},(message)=>{
            $messageFormSendLocationButton.removeAttribute('disabled')
            console.log(message)
        })
        
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})
