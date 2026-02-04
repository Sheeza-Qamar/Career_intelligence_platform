/* eslint-disable react/jsx-no-undef */
import {FaFacebook, FaGithub, FaInstagram, FaLinkedin, FaTwitter, FaYoutube,} from "react-icons/fa";
import {CgWebsite} from "react-icons/cg";
import React, {useContext} from "react";
import {ResumeContext} from "../../builder";
import {DragDropContext} from "react-beautiful-dnd";
import ModalHighlightMenu from "../components/ModalHighlightMenu";
import Header from "../components/Header";
import LeftSide from "../components/LeftSide";
import RightSide from "../components/RightSide";
import A4PageWrapper from "../components/A4PageWrapper";
import {onDragEndHandler} from "../utils/onDrugEndHandler";

const Preview = () => {
  const {resumeData, setResumeData} = useContext(ResumeContext);
  const icons = [
    {name: "github", icon: <FaGithub/>},
    {name: "linkedin", icon: <FaLinkedin/>},
    {name: "twitter", icon: <FaTwitter/>},
    {name: "facebook", icon: <FaFacebook/>},
    {name: "instagram", icon: <FaInstagram/>},
    {name: "youtube", icon: <FaYoutube/>},
    {name: "website", icon: <CgWebsite/>},
  ];

  const handleDragEnd = (result) => {
    onDragEndHandler(result, resumeData, setResumeData);
  };

  return (
    <div className="md:max-w-[60%] sticky top-0 preview rm-padding-print p-6 md:overflow-y-scroll md:h-screen bg-white text-black">
      <A4PageWrapper>
        <ModalHighlightMenu/>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Header resumeData={resumeData} icons={icons}/>
          <hr className="border-dashed my-2"/>
          <div className="grid grid-cols-3 gap-6">
            <LeftSide resumeData={resumeData}/>
            <RightSide resumeData={resumeData}/>
          </div>
        </DragDropContext>
      </A4PageWrapper>
    </div>
  );
};

export default Preview;
