import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

// SVG 아이콘
const Icons = {
  Back: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  DefaultProfile: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="white">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function ProfileEditPage() {
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState('음악듣는고양이');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 컴포넌트가 처음 열릴 때 localStorage에서 저장된 정보 불러오기
  useEffect(() => {
    const savedNickname = localStorage.getItem('profile_nickname');
    const savedImage = localStorage.getItem('profile_image');

    if (savedNickname) setNickname(savedNickname);
    if (savedImage) setPreviewUrl(savedImage);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  // 파일을 Base64 문자열로 변환하는 헬퍼 함수
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요!");
      return;
    }

    try {
      // 2. 닉네임 로컬 스토리지에 저장
      localStorage.setItem('profile_nickname', nickname);

      // 3. 이미지가 변경되었다면 Base64로 변환하여 로컬 스토리지에 저장
      if (profileImage) {
        const base64Image = await convertToBase64(profileImage);
        localStorage.setItem('profile_image', base64Image);
      }

      alert('프로필이 수정되었습니다!');
      navigate('/gps'); // 성공 시 이동
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('프로필 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    // 🚨 1. 최상위 부모에 position: 'relative' 추가 (모바일 화면의 기준점 역할)
    // padding-top을 줘서 absolute로 띄운 헤더가 아래 내용을 가리지 않게 합니다.
    <div 
      className="clean-profile-bg" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', 
        paddingTop: '60px', // 헤더 높이만큼 공간 확보
        boxSizing: 'border-box'
      }}
    >
      
      {/* 🚨 2. 헤더에 position: 'absolute' 적용 (기준점에 맞춰 상단 고정) */}
      <div 
        className="profile-header-container" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          padding: '15px 20px', 
          boxSizing: 'border-box',
          display: 'flex',              // 좌중우 배치를 위해 추가
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <button className="header-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none' }}>
          <Icons.Back />
        </button>
        
        <span className="profile-header-title">프로필 수정</span>
        
        <button className="header-btn confirm-btn" onClick={handleSubmit} style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold' }}>
          확인
        </button>
      </div>

      {/* 2. 프로필 사진 편집 영역 */}
      <div className="profile-edit-section" style={{ marginTop: '20px', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div 
          className="profile-image-circle" 
          onClick={handleProfileClick}
          style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid white' }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="프로필 미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icons.DefaultProfile />
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: 'none' }}
          accept="image/*"
        />

        <span className="profile-edit-label" style={{ marginTop: '10px', color: 'white' }}>사진 편집</span>
      </div>

      {/* 3. 닉네임 입력 영역 */}
      <div className="nickname-row" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="nickname-label-text" style={{ color: 'white', fontWeight: 'bold' }}>닉네임</label>
        <input 
          className="nickname-input-custom"
          type="text" 
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

    </div>
  );
}