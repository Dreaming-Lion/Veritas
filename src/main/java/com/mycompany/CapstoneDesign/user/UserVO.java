package com.mycompany.CapstoneDesign.user;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore; // @JsonIgnore 포함된거

public class UserVO {
	/**
	 * userVO, user_id, email, password, nickname, create_at, update_at
	 */
	private String user_id;
	private String email;

	@JsonIgnore //password 필드가 JSON으로 노출되지 않도록 설정해야한다 어쩌고... 
	private String password;
	private String nickname;

	private LocalDateTime create_at; // 계정 생성시간
	private LocalDateTime update_at; // 최근 수정시간

	// 기본 생성자
	public UserVO() {
	}

	// 모든 필드 생성자
	public UserVO(String user_id, String email, String password, String nickname, LocalDateTime create_at,
			LocalDateTime update_at) {
		this.user_id = user_id;
		this.email = email;
		this.password = password;
		this.nickname = nickname;
		this.create_at = create_at;
		this.update_at = update_at;
	}

	// 이하 getter, setter

	public String getUser_id() {
		return user_id;
	}

	public void setUser_id(String user_id) {
		this.user_id = user_id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
	}

	public LocalDateTime getCreate_at() {
		return create_at;
	}

	public void setCreate_at(LocalDateTime create_at) {
		this.create_at = create_at;
	}

	public LocalDateTime getUpdate_at() {
		return update_at;
	}

	public void setUpdate_at(LocalDateTime update_at) {
		this.update_at = update_at;
	}

}
