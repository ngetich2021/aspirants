import Image from 'next/image';
import React from 'react'

export default function Team() {
  const teamMembers = [
    { name: "Hosea Yano", phone: "0704 876 954", role: "Chairman", location: "Marakwet East" },
    { name: "Lonah Yano", phone: "0704 876 954", role: "secretary", location: "Keiyo South" },
    { name: "Luka Ruto", phone: "0704 876 954", role: "treasurer", location: "Keiyo North" },
    { name: "Ruth Nyamu", phone: "0704 876 954", role: "Organizing secretary", location: "Marakwet West" },
  ];

  const leader = { name: "Justine Chemanda", phone: "0704 876 954", role: "Leader", location: "" };

  return (
    <div className="w-full bg-white p-4 font-sans text-gray-900">
      <h2 className="text-xl md:text-2xl font-bold mb-8">Our team</h2>

      {/* Leader - Centered Top */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-24 h-24 md:w-32 md:h-32 mb-4 relative">
           {/* Replace with actual image tag if available */}
           <Image src={'/sn-5.png'} alt="Leader" className="rounded-full object-cover" fill />
        </div>
        <div className="text-center">
          <p className="font-bold text-[3.5vw] md:text-xl">{leader.name}</p>
          <p className="font-bold text-[3vw] md:text-lg">{leader.phone}</p>
          <p className="font-bold text-[3vw] md:text-lg">{leader.role}</p>
        </div>
      </div>

      {/* Team Grid - Forced single row that shrinks */}
      <div className="flex flex-row justify-between items-start gap-2 w-full overflow-hidden">
        {teamMembers.map((member, index) => (
          <div key={index} className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 md:w-24 md:h-24 mb-3 relative">
               <Image src={'/sn-5.png'} alt={member.name} className="rounded-full object-cover" fill />
            </div>
            <div className="whitespace-nowrap">
              <p className="font-bold text-[2.5vw] md:text-base">{member.name}</p>
              <p className="font-bold text-[2.2vw] md:text-sm">{member.phone}</p>
              <p className="font-bold text-[2.2vw] md:text-sm capitalize">{member.role}</p>
              <p className="font-bold text-[2.2vw] md:text-sm">{member.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}