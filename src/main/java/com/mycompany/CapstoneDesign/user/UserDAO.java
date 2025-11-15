package com.mycompany.CapstoneDesign.user;

import java.util.List;

public interface UserDAO {
	// 1. 회원가입 - 새로운 user 데이터 저장
	int insertUser(UserVO user);

	// 2. 이메일로 사용자 조회 (로그인 시 사용)
	UserVO getUserByEmail(String email);

	// 3. user_id로 사용자 조회 (세션 관리 등)
	UserVO getUserByID(String user_id);

	// 이메일 존재 여부 확인
	boolean existsEmail(String email);
	
	// 전체 사용자 조회 관리 혹은 테스트 용도.
	List<UserVO> getUserList();
}
