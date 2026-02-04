import React, {createContext, useState} from "react";
import FormCloseOpenBtn from "./FormCloseOpenBtn";
import Preview from "./preview/ui/Preview";
import DefaultResumeData from "./utility/DefaultResumeData";
import Form from "./form/ui/Form";
import WinPrint from "./utility/WinPrint";

const ResumeContext = createContext(DefaultResumeData);

export default function Builder() {
  // resume data
  const [resumeData, setResumeData] = useState(DefaultResumeData);

  // form hide/show
  const [formClose, setFormClose] = useState(false);

  // profile picture
  const handleProfilePicture = (e) => {
    const file = e.target.files[0];

    if (file instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeData({...resumeData, profilePicture: event.target.result});
      };
      reader.readAsDataURL(file);
    } else {
      console.error("Invalid file type");
    }
  };

  const handleChange = (e) => {
    setResumeData({...resumeData, [e.target.name]: e.target.value});
    console.log(resumeData);
  };

  return (
    <>
      <ResumeContext.Provider
        value={{
          resumeData,
          setResumeData,
          handleProfilePicture,
          handleChange,
        }}
      >
        <div className="f-col gap-4 md:flex-row justify-evenly max-w-7xl md:mx-auto md:h-screen">
          {!formClose && (
            <Form/>
          )}
          <Preview/>
        </div>
        <FormCloseOpenBtn formClose={formClose} setFormClose={setFormClose}/>
        <WinPrint/>
      </ResumeContext.Provider>
    </>
  );
}
export {ResumeContext};
