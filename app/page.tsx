import { getFile, listFiles } from '@/lib/github/files'
import React from 'react'

const page = async() => {
  console.log(await listFiles("bimal009/rack"))
  return (
    <div>
      
    </div>
  )
}

export default page
