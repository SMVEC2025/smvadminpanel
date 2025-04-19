import React from 'react'

function ChatProfileLayer({data}) {
  return (
    <div className='cpl_main'>
      <div className='cpl_div1'>
      <div className="imgdiv" style={{ width: "60px", height: "60px" }}>
              {data.name.split("")[0]}
            </div>
      </div>
    </div>
  )
}

export default ChatProfileLayer